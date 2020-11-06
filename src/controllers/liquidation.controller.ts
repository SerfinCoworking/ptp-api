import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period, { periodSchema } from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import ILiquidation, { IEmployeeLiq } from '../interfaces/liquidation.interface';
import { IPeriod, IShift, IEvent} from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import moment from 'moment';
import { ObjectID, ObjectId } from 'mongodb';
import * as helpers  from '../utils/helpers';
import { isLength } from 'lodash';

class LiquidationController extends BaseController{

  new = async (req: Request, res: Response) => { 
    const { fromDate, toDate } = req.query;
    try{
      const fromDateFormat = moment(fromDate, "DD_MM_YYYY").format("YYYY-MM-DD");
      const toDateFormat = moment(toDate, "DD_MM_YYYY").format("YYYY-MM-DD");
      const periods: IPeriod[] | null = await Period.find(
        {
          $and: [{
            $or: [
            {
              $and: [
                { fromDate: { $lte: fromDateFormat } },
                { toDate: {$gte: fromDateFormat } }
              ]
            }, {
              $and: [
                { fromDate: { $lte: toDateFormat } },
                { toDate: {$gte: toDateFormat } }
              ]
            },{
              $and: [
                { fromDate: { $gte: fromDateFormat } },
                { toDate: {$lte: toDateFormat } }
              ]
            }]
          }]
        });
      
        const employees: IEmployee[] = await Employee.find();
        // tenemos los periodos
        // 
        const liquidations: ILiquidation[] = [];
        await Promise.all(employees.map( async (employee: IEmployee, eIndex) => {
          let day_hours: number = 0;
          let night_hours: number = 0;
          let total_hours: number = 0;
          let total_extra: number = 0;

          await Promise.all(periods.map( async (period: IPeriod) => {
            await Promise.all(period.shifts.map( async (shift: IShift) => {
              await Promise.all(shift.events.map( async (event: IEvent) => {
                
                if(employee._id.equals(shift.employee._id)){
                  const realFrom = moment(event.fromDatetime);
                  const realTo = moment(event.toDatetime);
                  const toDaytime = moment(event.toDatetime);
                  const toNighttime = moment(event.toDatetime);
                  let  dayHours: number = 0;
                  let  nightHours: number = 0;

                  const startDay = moment(event.fromDatetime).set("hours", 6).set("minutes", 0);
                  const endDay = moment(event.toDatetime).set("hours", 21).set("minutes", 0);
console.log(startDay, endDay);

                  // Nocturno 21 - 6
                  // Diurno 6 - 21
                  // Feriados (discriminar)

                  // si ambas horas se encuentra entre las horas diurnas
                  if(realFrom.isBetween(startDay, endDay) && realTo.isBetween(startDay, endDay)){
                    dayHours = realTo.diff(realFrom, 'hours');

                  // }else if{
                    // sino from se encuentra entre las horas diurnas

                  // }
                  // }else if{
                    // sino to se encuentra entre las horas diurnas
                    
                    
                  // }
                  }else {
                    nightHours = realTo.diff(realFrom, 'hours');
                    // sino ninguna se encuentra entre las horas diurnas
                  }


                  day_hours += dayHours;
                  night_hours += nightHours;
                  total_hours += (dayHours + nightHours);
                  total_extra += 1;
                }

              }));
            }));
          }));

          const employeeLiq: IEmployeeLiq = {
            _id: employee._id,
            enrollment: employee.enrollment,
            firstName: employee.profile.firstName,
            lastName: employee.profile.lastName,
            avatar: employee.profile.avatar,
            dni: employee.profile.dni
          } as IEmployeeLiq;
          liquidations.push({
            employee: employeeLiq,
            day_hours: day_hours,
            night_hours: night_hours,
            total_hours: total_hours,
            total_extra: total_extra,
          } as ILiquidation);
        }));
          
          
           
            
        // console.log(liquidations.length, "DEBUG LENGTH");
        // await Promise.all(liquidations.map(async (liq: ILiquidation) => {
        //   const liqIndex: number = await helpers.aFindIndex(liquidations, async(subliq) => {
        //     return Promise.resolve(subliq.employee._id.equals(liq.employee._id))
        //   });
          
        //   if(liqIndex > 0){
        //     liquidations[liqIndex].day_hours += 1;
        //     liquidations[liqIndex].night_hours  += 1;
        //     liquidations[liqIndex].total_hours  += 1;
        //     liquidations[liqIndex].total_extra  += 1;
        //   }
          
          
        // }));
        console.log(liquidations, liquidations.length, "===LIQUIDATIONS");
        return res.status(200).json("periods found!");
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

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }
}

export default new LiquidationController();
