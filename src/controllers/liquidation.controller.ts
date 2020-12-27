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
import News from '../models/news.model';
import INews from '../interfaces/news.interface';
import IHoursByWeek from '../interfaces/liquidation.interface';
import { ObjectId } from 'mongodb';

class LiquidationController extends BaseController{

  new = async (req: Request, res: Response): Promise<Response<ILiquidation[]>> => { 
    const { fromDate, toDate, employeeSearch } = req.query;
    try{
      const fromDateMoment = moment(fromDate, "DD_MM_YYYY").startOf('day');
      const toDateMoment = moment(toDate, "DD_MM_YYYY").endOf('day');
      const fromDateFormat = fromDateMoment.format("YYYY-MM-DD");
      const toDateFormat = toDateMoment.format("YYYY-MM-DD");
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
      
        const employees: IEmployee[] = await Employee.find({
          $or: [
            {"profile.firstName":  { $regex: new RegExp( employeeSearch, "ig")}},
            {"profile.lastName":  { $regex: new RegExp( employeeSearch, "ig")}},
          ]
        });

        const queryByDate = {          
          $or: [
          {
            $and: [
              { dateFrom: { $lte: fromDateFormat } },
              { dateTo: {$gte: fromDateFormat } }
            ]
          }, {
            $and: [
              { dateFrom: { $lte: toDateFormat } },
              { dateTo: {$gte: toDateFormat } }
            ]
          },{
            $and: [
              { dateFrom: { $gte: fromDateFormat } },
              { dateTo: {$lte: toDateFormat } }
            ]
          }]
        };

        const newsFeriados: INews[] = await News.find({
          $and: [
            queryByDate,
            {
            "concept.key": "FERIADO"
          }],
        });
        
        
        
        const newsCapacitation: INews[] = await News.find({
          $and: [
            queryByDate,
            {
              "concept.key": "CAPACITACIONES"
          }],
        });
        
        const newsLicSinSueldo: INews[] = await News.find({
          $and: [
            queryByDate,
            {
              "concept.key": "LIC_SIN_SUELDO"
          }],
        });
        
        // tenemos los periodos
        // 
        const liquidations: ILiquidation[] = [];
        await Promise.all(employees.map( async (employee: IEmployee, eIndex) => {
          let day_hours: number = 0;
          let night_hours: number = 0;
          let total_hours: number = 0;
          let total_extra: number = 0;
          let total_feriado: number = 0;
          let total_suspension: number = 0;
          let total_lic_justificada: number = 0;
          let total_lic_no_justificada: number = 0;
          let total_days_vaciones: number = 0;
          let total_adelanto: number = 0;
          let total_viaticos: number = 0;
          let total_art_in_hours: number = 0;
          let total_capacitation_hours: number = 0;
          let total_lic_sin_sueldo_days: number = 0;
          let presentismo: number = 100;
          let quantity_of_events: number = 0;
          
          const counterDay: moment.Moment = moment(fromDateMoment);
          const weeks: IHoursByWeek[] = [];

          const newsSuspension: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "SUSPENSION"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');
          
          const newsLicJustificada: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "LIC_JUSTIFICADA"
              },{
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');
          
          const newsLicNoJustificada: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "LIC_NO_JUSTIFICADA"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');
          
          const newsVacaciones: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "VACACIONES"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');
          
          const newsAdelanto: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "ADELANTO"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');
          
          const newsArt: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "ART"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation');


          while(counterDay.isBefore(toDateMoment, 'date')){
            
            const fromDate: moment.Moment = moment(counterDay).startOf('day');
            const toDate: moment.Moment = moment(counterDay).add(6, 'days').endOf('day');
            if(toDate.isAfter(toDateMoment)){
              weeks.push(<IHoursByWeek>{from: fromDate, to: toDateMoment.endOf('day'), totalHours: 0, totalExtraHours: 0});
            }else{
              weeks.push(<IHoursByWeek>{from: fromDate, to: toDate, totalHours: 0, totalExtraHours: 0});
            }
            counterDay.add(7, 'days');
          }
          
          await Promise.all(periods.map( async (period: IPeriod) => {
            await Promise.all(period.shifts.map( async (shift: IShift) => {
              await Promise.all(shift.events.map( async (event: IEvent) => {
                
                if(employee._id.equals(shift.employee._id)){
                  const realFrom = moment(event.fromDatetime);
                  const realTo = moment(event.toDatetime);
                  
                  let  dayHours: number = 0;
                  let  nightHours: number = 0;

                  if(event.checkin){
                    total_viaticos++; 
                  }


                  await Promise.all(weeks.map( async (week: any) => {
                    let total: number = 0;

                    if(realFrom.isBetween(week.from, week.to, "date", "[]") && realTo.isBetween(week.from, week.to, "date", "[]")){
                      total += realTo.diff(realFrom, 'hours');
                    }else if(realFrom.isBetween(week.from, week.to, "date", "[]")){
                      // se agregar 1 dia mas ya que los minutos no los toma como hora
                      const newsEnd = moment(week.to).add(1, 'minute');
                      total += newsEnd.diff(realFrom, 'hours');
                    }else if(realTo.isBetween(week.from, week.to, "date", "[]")){
                      total += realTo.diff(week.from, 'hours');
                    }
                    week.totalHours += total;
                    if(week.totalHours > 48){
                      week.totalExtraHours = week.totalHours - 48;
                    }
                  }));
                  
                  // Nocturno 21 - 6
                  // Diurno 6 - 21
                  const startDayFrom = moment(event.fromDatetime).set("hours", 6).set("minutes", 0);
                  const endDayFrom = moment(event.fromDatetime).set("hours", 21).set("minutes", 0);


                  // si ambas horas se encuentra entre las horas diurnas
                  if(realFrom.isBetween(startDayFrom, endDayFrom, 'hour', '[]') && realTo.isBetween(startDayFrom, endDayFrom, 'hour', '[]')){
                    dayHours = realTo.diff(realFrom, 'hours');

                  }else if(realFrom.isBetween(startDayFrom, endDayFrom, 'hour', '[]')){
                    // sino from se encuentra entre las horas diurnas
                    dayHours = endDayFrom.diff(realFrom, 'hours');
                    nightHours = realTo.diff(endDayFrom, 'hours');
                    
                  }else if(realTo.isBetween(startDayFrom, endDayFrom, 'hour', '[]')){
                    // sino to se encuentra entre las horas diurnas
                    dayHours = startDayFrom.diff(realFrom, 'hours');
                    nightHours = realTo.diff(startDayFrom, 'hours');
                    
                  }else{
                    nightHours = realTo.diff(realFrom, 'hours');
                    // sino ninguna se encuentra entre las horas diurnas
                  }

                  day_hours += dayHours;
                  night_hours += nightHours;
                  total_hours += (dayHours + nightHours);
                  total_extra += 0;
                  
                  await Promise.all(newsFeriados.map( async (feriado: INews, index: number) => {
                    const total: number = this.calculateHours(feriado, employee, realFrom, realTo);
                    Object.assign(newsFeriados[index],{ worked_hours: ((feriado.worked_hours || 0) + total) });
                    total_feriado += total;
                  }));
                  
                  await Promise.all(newsSuspension.map( async (suspension: INews, index: number) => {
                    const total: number = this.calculateHours(suspension, employee, realFrom, realTo);
                    Object.assign(newsSuspension[index],{ worked_hours: ((suspension.worked_hours || 0) + total) });
                    total_suspension += total;
                  }));
                    
                  // licencias justificadas
                  await Promise.all(newsLicJustificada.map( async (lic_justificada: INews, index: number) => {
                    // debemos filtrar las emfermedades
                    if(lic_justificada.reason?.toUpperCase() === 'EMFERMEDAD'){ 
                      // se cuentan la cantidad de eventos que poseen las licencias por emfermedad
                      // entre los dias de la novedad
                      if(realFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]') || realTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]')){
                        quantity_of_events++;
                      }
                    }
                    const total: number = this.calculateHours(lic_justificada, employee, realFrom, realTo);
                    Object.assign(newsLicJustificada[index],{ worked_hours: ((lic_justificada.worked_hours || 0) + total) });
                    total_lic_justificada += total;
                  }));
                  
                  await Promise.all(newsLicNoJustificada.map( async (lic_no_justificada: INews, index: number) => {
                    const total: number = this.calculateHours(lic_no_justificada, employee, realFrom, realTo);
                    Object.assign(newsLicNoJustificada[index],{ worked_hours: ((lic_no_justificada.worked_hours || 0) + total) });
                    total_lic_no_justificada += total;
                  }));
                  
                  await Promise.all(newsArt.map( async (art: INews, index: number) => {
                    const total: number = this.calculateHours(art, employee, realFrom, realTo);
                    Object.assign(newsArt[index],{ worked_hours: ((art.worked_hours || 0) + total) });
                    total_art_in_hours += total;
                  }));    
                }
                
              }));//map events
            }));
          }));// map period

        // buscamos todos los periodos segun rango de fecha de la lic justificada por emfermedad
        // filtramos por empleado
        // y hacemos count de eventos entre fechas


        // vacaciones
        await Promise.all(newsVacaciones.map( async (vaciones: INews) => {
          total_days_vaciones += this.calculateDays(vaciones, employee, fromDateMoment, toDateMoment);
        }));
        
        // licencia sin goce de sueldo
        await Promise.all(newsLicSinSueldo.map( async (licSinSueldo: INews) => {
          total_lic_sin_sueldo_days += this.calculateDays(licSinSueldo, employee, fromDateMoment, toDateMoment);
        }));
         
        //  adelantos
        await Promise.all(newsAdelanto.map( async (adelanto: INews) => {
          total_adelanto += this.calculateImport(adelanto, employee, fromDateMoment, toDateMoment);
        }));
         
        //  extra hours
        await Promise.all(weeks.map( async (week: IHoursByWeek) => {
          total_extra += week.totalExtraHours;
        }));

        //  hours capacitation
        await Promise.all(newsCapacitation.map( async (capacitation: INews) => {
          const employeeFiltered = capacitation.employeeMultiple?.find( (employeeCap: IEmployee) => employeeCap._id.equals(employee._id));
          if(capacitation.capacitationHours && employeeFiltered ){
            total_capacitation_hours += capacitation.capacitationHours;
          }
        }));

        if(newsSuspension.length || newsLicNoJustificada.length){
          presentismo = 0;
        }else if(quantity_of_events > 0){
          // si hay licencias por emfermedad descontamos presentismo segun corresponda          
          if(quantity_of_events == 2){
             presentismo -= 10;
          }else if(quantity_of_events == 3){ 
            presentismo -= 20;
          }else if(quantity_of_events > 3){
            presentismo -= 30;
          };
        }

        const employeeLiq: IEmployeeLiq = {
          _id: employee._id,
          enrollment: employee.enrollment,
          firstName: employee.profile.firstName,
          lastName: employee.profile.lastName,
          avatar: employee.profile.avatar,
          dni: employee.profile.dni,
          cuilPrefix: employee.profile.cuilPrefix,
          cuilDni: employee.profile.cuilDni,
          cuilSufix: employee.profile.cuilSufix,
          function: employee.profile.function,
          employer: employee.profile.employer,
          art: employee.profile.art
        } as IEmployeeLiq;
        liquidations.push({
          employee: employeeLiq,
          total_day_in_hours: day_hours,
          total_night_in_hours: night_hours,
          total_in_hours: total_hours,
          total_extra_in_hours: total_extra,
          total_feriado_in_hours: total_feriado,
          total_suspension_in_hours: total_suspension,
          total_lic_justificada_in_hours: total_lic_justificada,
          total_lic_no_justificada_in_hours: total_lic_no_justificada,
          total_vaciones_in_days: total_days_vaciones,
          total_adelanto_import: total_adelanto,
          total_hours_work_by_week: weeks,
          total_viaticos: total_viaticos,
          total_art_in_hours: total_art_in_hours,
          total_capacitation_hours: total_capacitation_hours,
          total_lic_sin_sueldo_days: total_lic_sin_sueldo_days,
          suspensiones: newsSuspension,
          lic_justificadas: newsLicJustificada,
          lic_no_justificadas: newsLicNoJustificada,
          arts: newsArt,
          presentismo: presentismo 
        } as ILiquidation);
      }));// map employee
      
      return res.status(200).json(liquidations);
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

  private calculateHours = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    // si el la fecha de incio del evento se encuentra comprendida por las fechas del feriado
    // entonces calculamos las horas 
    // a tener en cuenta: que hay que tomar los minutos y no solo las horas
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]") && to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        total += to.diff(from, 'hours');
      }else if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        // se agregar 1 dia mas ya que los minutos no los toma como hora
        const newsEnd = moment(news.dateTo).add(1, 'day').startOf('day');
        total += newsEnd.diff(from, 'hours');
      }else if(to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        const newsStart = moment(news.dateFrom).startOf('day');
        total += to.diff(newsStart, 'hours');
      }
    }

    return total;
  }
  
  private calculateDays = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    const newsDateFrom: moment.Moment = moment(news.dateFrom).startOf('day');
    const newsDateTo: moment.Moment = moment(news.dateTo).endOf('day');
    // si el la fecha de incio del evento se encuentra comprendida por las fechas del feriado
    // entonces calculamos las horas 
    // a tener en cuenta: que hay que tomar los minutos y no solo las horas
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(newsDateFrom.isBetween(from, to, "date", "[]") && newsDateTo.isBetween(from, to, "date", "[]")){
        newsDateTo.add(1, 'day');
        total += newsDateTo.diff(newsDateFrom, 'days');
      }else if(newsDateFrom.isBetween(from, to, "date", "[]")){
        to.add(1, 'day');
        total += newsDateFrom.diff(to, 'days');
      }else if(newsDateTo.isBetween(from, to, "date", "[]")){
        from.add(1, 'day');
        total += newsDateTo.diff(from, 'days');
      }
    }
    return total;
  }
  
  private calculateImport = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    const newsDateFrom: moment.Moment = moment(news.dateFrom).startOf('day');
    // sumamos los adelantos recibidos
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(newsDateFrom.isBetween(from, to, "date", "[]") && news.import){
        total += news.import;
      }
    }
    return total;
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
    }
}

export default new LiquidationController();
