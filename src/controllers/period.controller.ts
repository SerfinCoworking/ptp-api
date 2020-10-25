import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import { IPeriod, IShift, IEvent} from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import { ObjectId } from 'mongodb';
import moment from 'moment';

class PeriodController extends BaseController{

  create = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['fromDate', 'toDate', 'objective']));
    try{
      const period: IPeriod = await new Period({
         fromDate: body.fromDate,
         toDate: body.toDate,
         "objective._id": body.objective._id,
         "objective.name": body.objective.name
        });
        // validates date and objective period
        const isInvalid: boolean = await Period.schema.methods.validatePeriod(period);
      if(isInvalid){
        throw new GenericError({property:"Period", message: "No se pudo crear el Periodo debido a que una o ambas fechas ingresadas para este objectivo, ya se encuentran definidas.", type: "BAD_REQUEST"});
      }

      await period.save();
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['fromDate', 'toDate']));
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOne({_id: id});
      
      if(!period) throw new GenericError({property:"Period", message: "No se encontro el periodo.", type: "BAD_REQUEST"});
      
      period.fromDate = body.fromDate;
      period.toDate = body.toDate;
      
      // validates date and objective period
      const isInvalid: boolean = await Period.schema.methods.validatePeriod(period);
      
      if(isInvalid){
        throw new GenericError({property:"Period", message: "No se pudo actualizar el Periodo debido a que una o ambas fechas ingresadas para este objectivo, ya se encuentran definidas.", type: "BAD_REQUEST"});
      }

      await Promise.all(
        period.shifts.map(async (shift: IShift, sIndex: number) => {
          await Promise.all(shift.events.map((event: IEvent, eIndex: number) => {
            const fromDate = moment(event.fromDatetime);
            if(!fromDate.isBetween(period.fromDate, period.toDate)){
              period.shifts[sIndex].events.splice(eIndex, 1);
            }          
          }));
        })
      );

      await period.save();
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  createShifts = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['employees']));
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOne({ _id: id });
      if(!period) throw new GenericError({property:"Period", message: "No se encontro el periodo.", type: "BAD_REQUEST"});
      await Promise.all(body.employees.map(async( employee: any) => {
        const shift: IShift = {
          employee: {
            _id: new ObjectId(employee._id),
            firstName: employee.firstName,
            lastName: employee.lastName,
          },
          events: [] as IEvent[]
        };

        period.shifts.push(shift);
      }));
      await period.save();
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  getPeriod = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    try{
      const id: string = req.params.id;
      const period: IPeriod | null = await Period.findOne({_id: id});
  
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
  
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  getPrintPeriod = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    try{
      const id: string = req.params.id;
      const period: IPeriod | null = await Period.findOne({_id: id});
  
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
  
      const periodDigest = await this.getDaysObject(period);
      return res.status(200).json(periodDigest);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  updateShifts = async (req: Request, res: Response): Promise<Response<any>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true };
      // update only shifts
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: id}, {
        shifts: body.shifts
      }, opts);
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      return res.status(200).json(period);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Period.findByIdAndDelete(id);
      return res.status(200).json("period deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private getPeriodWithEmployees = async (period: IPeriod): Promise<{periodDigest: IPeriod, shifts: IShift[]}> => {

    // traemos todos los empleados salvo los con la cantidad de eventos y horas a cumplir
    // agregamos parametro para indicar si queremos filtrar por periodo, de esta forma podremos
    // reutilizar la funcion para cuando este armada la planilla de turnos (edicion)
    // pero en ese caso necesitamos al periodo en cuestion con ya con dichos eventos como "other events"
    const shiftsDigest: IShift[] = [];  
    const otherPeriods: IPeriod[] | null = await Period.find(
      {
        $and: [{
          $or: [
          {
            $and: [
              { fromDate: { $lte: period.fromDate } },
              { toDate: {$gte: period.fromDate } }
            ]
          }, {
            $and: [
              { fromDate: { $lte: period.toDate } },
              { toDate: {$gte: period.toDate } }
            ]
          },{
            $and: [
              { fromDate: { $gte: period.fromDate } },
              { toDate: {$lte: period.toDate } }
            ]
          }]
        },{
          _id: { $nin: [ period._id ]}
        }]
      });

    const employees: IEmployee[] | null = await Employee.find();

    
    await Promise.all(employees.map( async (employee: IEmployee ) => {
      let otherEvents: IEvent[] = [];
      await Promise.all(otherPeriods.map( async (p: IPeriod) => {
        await Promise.all(p.shifts.map((shift: IShift)=> {
          if(employee._id.equals(shift.employee._id)){
            otherEvents.push(...shift.events);
          }
        }));
      }));//end otherPeriods map
      
      // buscamos entres las guardias la que coincida con el empleado
      const shiftFound: number = await Promise.resolve(
        period.shifts.findIndex( (mshift: IShift, mindex: number) => {
          return mshift.employee._id.equals(employee._id);
      }));

      // Si se encontro alguna coincidencia con el empleado, le cargamos los otros eventos de otros objetivos
      if(shiftFound > -1){  
        _.set(period.shifts[shiftFound], 'otherEvents', otherEvents);
      }else{
        // por ultimo armamos el array con los empleados y sus otros eventos en otros objetivos mismo periodo
        shiftsDigest.push({
          employee: {
            _id: employee._id,
            firstName: employee.profile.firstName,
            lastName: employee.profile.lastName
          },
          events: [],
          otherEvents: otherEvents
        });
      }
    }));
    return {periodDigest: period, shifts: shiftsDigest};
  }


  private getDaysObject = async (period: IPeriod): Promise<Array<string[]>> =>{
    
    
    return await new Promise( (resolve, reject) => {
      
        let fromDate = moment(period.fromDate);
        let toDate = moment(period.toDate);
        
        toDate = toDate.add(1, 'day'); // (while fix) add 1 day
        
        const weeks: Array<string[]> = [];
        let days: string[] = [];
        let weekCounter: number = 0;
        let condition: boolean = (fromDate.isSame(toDate, "day") && fromDate.isSame(toDate, "month") && fromDate.isSame(toDate, "year"));
      
        while(!condition){
        
        days.push(fromDate.format("YYYY-MM-DD"));
        fromDate.add(1, "day");
        
        condition = (fromDate.isSame(toDate, "day") && fromDate.isSame(toDate, "month") && fromDate.isSame(toDate, "year"));
              
        weekCounter++;
        if(weekCounter == 7){
          weeks.push(days);
          days = [];
          weekCounter = 0;
        }else if(condition){
          weeks.push(days);
        }
      }
        resolve(weeks);
    });

  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }
}

export default new PeriodController();
