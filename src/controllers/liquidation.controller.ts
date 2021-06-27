import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import ILiquidation, {IEmployeeLiquidation, IEmployeeLiq, IHoursByWeek,IEventWithObjective, ILicReason } from '../interfaces/liquidation.interface';
import { IPeriod, IShift, IEvent} from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import moment from 'moment';
import News from '../models/news.model';
import INews, { _ljReasons } from '../interfaces/news.interface';
import Liquidation from '../models/liquidation.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { createMovement } from '../utils/helpers';

class LiquidationController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"dateFrom": 1});
    try{
        const query = {
          $or: [
            {"dateFrom":  { $regex: new RegExp( target, "ig")}},
            {"dateTo":  { $regex: new RegExp( target, "ig")}},
          ]
        };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10),
        select: "dateFrom dateTo"
      };

      const liquidations: PaginateResult<ILiquidation> = await Liquidation.paginate(query, options);
      return res.status(200).json(liquidations);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ILiquidation>> => {
    const id: string = req.params.id;
    try{
      const liquidation: ILiquidation | null = await Liquidation.findOne({_id: id});
      if(!liquidation) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(liquidation);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  new = async (req: Request, res: Response): Promise<Response<ILiquidation>> => { 
    const { fromDate, toDate, employeeSearch, employeeId } = req.query;
    try{
      const fromDateMoment = moment(fromDate, "DD_MM_YYYY").startOf('day');
      const toDateMoment = moment(toDate, "DD_MM_YYYY").endOf('day');
      
      let liquidation: ILiquidation | null = await Liquidation.findOne({dateFrom: fromDateMoment.format("YYYY-MM-DD"), dateTo: toDateMoment.format("YYYY-MM-DD")});

      if(liquidation){
        return res.status(200).json(liquidation);
      }

      liquidation = {
        dateFrom: fromDateMoment.format("YYYY-MM-DD"),
        dateTo: toDateMoment.format("YYYY-MM-DD"),
      } as ILiquidation;

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
        $and: [
          {
            $or: [
            {"profile.firstName":  { $regex: new RegExp( employeeSearch, "ig")}},
            {"profile.lastName":  { $regex: new RegExp( employeeSearch, "ig")}},
            ]
          },
          {_id: { $in : employeeId.split("_")}}
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

      
        
      const newsCapacitation: INews[] = await News.find({
        $and: [
          queryByDate,
          {
            "concept.key": "CAPACITACIONES"
        }],
      }).select('capacitationHours concept dateFrom dateTo employeeMultiple observation');
      
      
      
        // tenemos los periodos
        // 
        const liquidations: IEmployeeLiquidation[] = [];
        await Promise.all(employees.map( async (employee: IEmployee, eIndex) => {
          let day_hours: number = 0;
          let night_hours: number = 0;
          let total_hours: number = 0;
          let total_extra: number = 0;
          let total_feriado: number = 0;
          let total_suspension: number = 0;
          let total_lic_justificada: number = 0;
          let total_lic_jus_by_working_day: Array<string> = [];
          let total_lic_no_jus_by_working_day: Array<string> = [];
          let total_suspension_by_working_day: Array<string> = [];
          let lic_justificada_group_by_reason: ILicReason[] = [
            {
              key: "FALLEC_ESPOSA_HIJOS_PADRES",
              name: "Fallecimiento de esposa, hijos o padres",
              assigned_hours: 0
            },
            {
              key: "FALLEC_SUEGROS_HERMANOS",
              name: "Fallecimiento de suegros o hermanos",
              assigned_hours: 0
            },
            {
              key: "NAC_HIJO_ADOPCION",
              name: "Nacimiento de hijo o adopción",
              assigned_hours: 0
            },
            {
              key: "FALLEC_YERNO_NUERA",
              name: "Fallecimiento de yerno o nuera",
              assigned_hours: 0
            },
            {
              key: "MATRIMONIO",
              name: "Matrimonio",
              assigned_hours: 0
            },
            {
              key: "EXAMEN",
              name: "Exámenes",
              assigned_hours: 0
            },
            {
              key: "EMFERMEDAD",
              name: "Emfermedad",
              assigned_hours: 0
            } 
          ];
          let total_lic_no_justificada: number = 0;
          let total_days_vaciones: number = 0;
          let total_adelanto: number = 0;
          let total_plus_responsabilidad: number = 0;
          let total_viaticos: number = 0;
          let total_art_in_hours: number = 0;
          let total_art_by_working_day: Array<string> = [];
          let total_capacitation_hours: number = 0;
          let total_lic_sin_sueldo_days: number = 0;
          let presentismo: number = 100;
          let quantity_of_events: number = 0;
          const capacitaciones: INews[] = [];
          
          const counterDay: moment.Moment = moment(fromDateMoment);
          const weeks: IHoursByWeek[] = [];

          const newsFeriados: INews[] = await News.find({
            $and: [
              queryByDate,
              {
              "concept.key": "FERIADO"
              },
              {
                "employee._id": employee._id
              }
            ]
          });

          const newsLicSinSueldo: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "LIC_SIN_SUELDO"
              },
              {
                "employee._id": employee._id
              }
            ],
          });

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
              {
                $and: [
                  { dateFrom: { $gte: fromDateFormat } },
                  { dateFrom: { $lte: toDateFormat } }
                ]
              },
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
          
          const newPlusResponsabilidad: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "PLUS_RESPONSABILIDAD"
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
          
          const newsEmbargos: INews[] = await News.find({
            $and: [
              queryByDate,
              {
                "concept.key": "EMBARGO"
              },
              {
                "employee._id": employee._id
              }
            ],
          }).select('dateFrom dateTo employee._id concept reason import capacitationHours observation docLink');

          const newsStatus: INews | null = await News.findOne({
            $and: [
              { 
                $or: [
                  {
                    "concept.key": "BAJA"
                  },{
                    "concept.key": "ALTA"
                  },{
                    "concept.key": "ACTIVO"
                  }
                ]
              },
              {
                "employee._id": employee._id
              }
            ]
          }).sort( {"dateFrom": 1}).limit(1).select('dateFrom dateTo employee._id concept reason observation');



          while(counterDay.isBefore(toDateMoment, 'date')){
            
            const fromDate: moment.Moment = moment(counterDay).startOf('day');
            const toDate: moment.Moment = moment(counterDay).add(6, 'days').endOf('day');
            if(toDate.isAfter(toDateMoment)){
              weeks.push(<IHoursByWeek>{
                from: fromDate.format("YYYY-MM-DD"),
                to: toDateMoment.endOf('day').format("YYYY-MM-DD"),
                totalHours: 0,
                totalExtraHours: 0,
                events: []
              });
            }else{
              weeks.push(<IHoursByWeek>{
                from: fromDate.format("YYYY-MM-DD"),
                to: toDate.format("YYYY-MM-DD"),
                totalHours: 0,
                totalExtraHours: 0,
                events: []
              });
            }
            counterDay.add(7, 'days');
          }
          
          await Promise.all(periods.map( async (period: IPeriod) => {
            await Promise.all(period.shifts.map( async (shift: IShift) => {
              await Promise.all(shift.events.map( async (event: IEvent) => {
                
                if(employee._id.equals(shift.employee._id)){
                  const realFrom = moment(event.fromDatetime);
                  const realTo = moment(event.toDatetime);
                  
                  const maxHsDiurnas = 15;
                  const maxHsNocturnas = 9;

                  let  dayHours: number = 0;
                  let  nightHours: number = 0;
                  // Obetencion de viatiacos:
                  // 1 por cada guardia registrada
                  total_viaticos++; 

                  const totalHs: number = realTo.diff(realFrom, 'hours');

                  // Calculo de total horas diurnas y nocturnas
                  // Nocturno 21 - 6
                  // Diurno 6 - 21
                  const startFD_f = moment(event.fromDatetime).set("hours", 6).set("minutes", 0);
                  const endFD_f = moment(event.fromDatetime).set("hours", 21).set("minutes", 0);
                  const isSameDate = realFrom.isSame(realTo, 'day');

                  const startFD_t = moment(event.toDatetime).set("hours", 6).set("minutes", 0);
                  const endFD_t = moment(event.toDatetime).set("hours", 21).set("minutes", 0);
                 
                  // mi fecha de inicio comienza  dentro de la franja diurna
                  if (realFrom.isBetween(startFD_f, endFD_f, undefined, '[)')){
                    // si es el mismo dia
                    if(isSameDate){
                      dayHours = endFD_f.diff(realFrom, 'hours');
                      if(dayHours < totalHs){
                        // CASO: franja diurna / frnaja nocturna
                        nightHours = totalHs - dayHours;
                      }else{
                        // CASO: franja diurna / franja diurna
                        dayHours = realTo.diff(realFrom, 'hours');
                      }
                    }else{
                      // son diferentes dias
                      dayHours = endFD_f.diff(realFrom, 'hours');
                      if((totalHs - dayHours) > maxHsNocturnas){
                        // CASO: fraja diurna / franja nocturna / franja diurna
                        nightHours =  maxHsNocturnas;
                        dayHours +=  (totalHs - dayHours) - maxHsNocturnas;
                      }else{
                        // CASO: franja diurna / franja nocturna
                        nightHours = totalHs - dayHours;
                      }
                    }
                  }else{
                    // mi fecha de inicio comienza dentro de la franja nocturna
                    // mismo dia
                    if(isSameDate){
                      nightHours = startFD_f.diff(realFrom, 'hours');
                      if(nightHours < totalHs){
                        if((totalHs - nightHours) > maxHsDiurnas){
                          // CASO: franja nocturna / franja diurna / franja nocturna
                          dayHours =  maxHsDiurnas;
                          nightHours +=  (totalHs - nightHours) - maxHsDiurnas;
                        }else{
                          // CASO: franja nocturna / franja diurna
                          dayHours =  totalHs - nightHours;
                        }
                      }else{
                        // CASO: franja nocturna / franja nocturna
                        nightHours = realTo.diff(realFrom, 'hours');
                      }
                    }else{

                      nightHours = startFD_t.diff(realFrom, 'hours');

                      if((totalHs - nightHours) > maxHsDiurnas){
                        // CASO: franja nocturna / franja diurna / franja nocturna
                        dayHours =  maxHsDiurnas;
                        nightHours +=  (totalHs - nightHours) - maxHsDiurnas;
                      }else{
                        // CASO: franja noctuna / franja diurna
                        dayHours =  totalHs - nightHours;
                      }
                    }
                  }



                  // return res.status(200).json({
                  //   employee: `${employee.profile.firstName} ${employee.profile.lastName}`,
                  //   totalHs,
                  //   nightHours,
                  //   dayHours
                  // });


          

                  day_hours += dayHours;
                  night_hours += nightHours;
                  total_hours += (dayHours + nightHours);
                  total_extra += 0;       
                  // Fin calculo de total horas diurnas y nocturnas          
                  
                  // calculo de horas feriados
                  let feriadoHours: number = 0;
                  await Promise.all(newsFeriados.map( async (feriado: INews, index: number) => {
                    const total: number = this.calculateHours(feriado, employee, realFrom, realTo);
                    feriadoHours += total;
                    Object.assign(newsFeriados[index],{ worked_hours: ((feriado.worked_hours || 0) + total) });
                    total_feriado += total;
                  }));

                  // [Cantidad de horas / horas extras / eventos: por objetivo / horas / horas diurnas / horas nocturnas] Por semana
                  const eventWithObjective: IEventWithObjective = {
                    event: event,
                    objectiveName: period.objective.name,
                    diffInHours: realTo.diff(realFrom, 'hours'),
                    dayHours,
                    nightHours,
                    feriadoHours: feriadoHours
                  };

                  await Promise.all(weeks.map( async (week: any) => {
                    let total: number = 0;

                    // el calculo se hace por la guardia completa, no corta entre semanas
                    // si la guardia comienza en el ultimo dia de la semana, y termina en el comienzo
                    // de la siguiente, se toma el total de horas de la guardia como parte de la semana
                    // en la que inicio su guardia
                    if(realFrom.isBetween(week.from, week.to, "date", "[]")){
                      total += realTo.diff(realFrom, 'hours');
                      week.events.push(eventWithObjective);
                    }
                    week.totalHours += total;
                    if(week.totalHours > 48){
                      week.totalExtraHours = week.totalHours - 48;
                    }

                  }));
                  
                  await Promise.all(newsSuspension.map( async (suspension: INews, index: number) => {
                    const total: number = this.calculateHours(suspension, employee, realFrom, realTo);
                    const isInDate: boolean = (
                      (realFrom.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]") && realTo.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]")) ||
                      (realFrom.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]")) ||
                      (realTo.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]"))
                    )
                    Object.assign(newsSuspension[index],{ worked_hours: ((suspension.worked_hours || 0) + total) });
                    total_suspension += total;

                    if(!total_suspension_by_working_day.includes(realFrom.format("YYYY-MM-DD")) && isInDate){
                      total_suspension_by_working_day.push(realFrom.format("YYYY-MM-DD"));
                    }                   
                  }));
                    
                  // licencias justificadas
                  await Promise.all(newsLicJustificada.map( async (lic_justificada: INews, index: number) => {
                    
                    const total: number = this.calculateHours(lic_justificada, employee, realFrom, realTo);
                    const isInDate: boolean = (
                      (realFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]") && realTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]")) ||
                      (realFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]")) ||
                      (realTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]"))
                    )

                    Object.assign(newsLicJustificada[index], { assigned_hours: ((lic_justificada.assigned_hours || 0) + total) });
                    // asignamos la cantidad de horaas segun agrupacion por "reason"
                    if(lic_justificada.reason?.key.toUpperCase() === 'EMFERMEDAD'){ 
                      // se cuentan la cantidad de eventos que poseen las licencias por emfermedad
                      // entre los dias de la novedad
                      if(realFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]') || realTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]')){
                        quantity_of_events++;
                      }
                    }
                    await Promise.all(lic_justificada_group_by_reason.map(( reason: any) => {
                      if(lic_justificada.reason?.key.toUpperCase() === reason.key){ 
                        reason.assigned_hours += total;
                      }
                    }));

                    total_lic_justificada += total;

                    if(!total_lic_jus_by_working_day.includes(realFrom.format("YYYY-MM-DD")) && isInDate){
                      total_lic_jus_by_working_day.push(realFrom.format("YYYY-MM-DD"));
                    }
                  }));
                  
                  // licencias no justificadas
                  await Promise.all(newsLicNoJustificada.map( async (lic_no_justificada: INews, index: number) => {
                    const total: number = this.calculateHours(lic_no_justificada, employee, realFrom, realTo);
                    const isInDate: boolean = (
                      (realFrom.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]") && realTo.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]")) ||
                      (realFrom.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]")) ||
                      (realTo.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]"))
                    )
                    Object.assign(newsLicNoJustificada[index],{ worked_hours: ((lic_no_justificada.worked_hours || 0) + total) });
                    total_lic_no_justificada += total;

                    if(!total_lic_no_jus_by_working_day.includes(realFrom.format("YYYY-MM-DD")) && isInDate){
                      total_lic_no_jus_by_working_day.push(realFrom.format("YYYY-MM-DD"));
                    }
                  }));
                  
                  await Promise.all(newsArt.map( async (art: INews, index: number) => {
                    const total: number = this.calculateHours(art, employee, realFrom, realTo);
                    Object.assign(newsArt[index],{ worked_hours: ((art.worked_hours || 0) + total) });
                    total_art_in_hours += total;
                    const isInDate: boolean = (
                      (realFrom.isBetween(art.dateFrom, art.dateTo, "date", "[]") && realTo.isBetween(art.dateFrom, art.dateTo, "date", "[]")) ||
                      (realFrom.isBetween(art.dateFrom, art.dateTo, "date", "[]")) ||
                      (realTo.isBetween(art.dateFrom, art.dateTo, "date", "[]"))
                    )

                    if(!total_art_by_working_day.includes(realFrom.format("YYYY-MM-DD")) && isInDate){
                      total_art_by_working_day.push(realFrom.format("YYYY-MM-DD"));
                    }
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
          const newsDateFrom: moment.Moment = moment(vaciones.dateFrom).startOf('day');
          const newsDateTo: moment.Moment = moment(vaciones.dateTo).endOf('day').add(1, 'day');
          total_days_vaciones += newsDateTo.diff(newsDateFrom, 'days');
        }));
        
        // licencia sin goce de sueldo
        await Promise.all(newsLicSinSueldo.map( async (licSinSueldo: INews) => {
          total_lic_sin_sueldo_days += this.calculateDays(licSinSueldo, employee, fromDateMoment, toDateMoment);
        }));
         
        //  adelantos
        await Promise.all(newsAdelanto.map( async (adelanto: INews) => {
          total_adelanto += this.calculateImport(adelanto, employee, fromDateMoment, toDateMoment);
        }));
        
        // plus por responsabilidad
        await Promise.all(newPlusResponsabilidad.map( async (plus_responsabilidad: INews) => {
          total_plus_responsabilidad += this.calculateImport(plus_responsabilidad, employee, fromDateMoment, toDateMoment);
        }));
         
        //  extra hours
        await Promise.all(weeks.map( async (week: IHoursByWeek) => {
          total_extra += week.totalExtraHours;
        }));

        //  hours capacitation
        await Promise.all(newsCapacitation.map( async (capacitation: INews) => {
          const employeeFiltered = capacitation.employeeMultiple?.find( (employeeCap: IEmployee) => employeeCap._id.equals(employee._id));
          if(capacitation.capacitationHours && employeeFiltered ){
            capacitaciones.push(capacitation);
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
          art: employee.profile.art,
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
          total_lic_jus_by_working_day: total_lic_jus_by_working_day,
          total_lic_no_jus_by_working_day: total_lic_no_jus_by_working_day,
          total_suspension_by_working_day: total_suspension_by_working_day,
          total_lic_no_justificada_in_hours: total_lic_no_justificada,
          total_vaciones_in_days: total_days_vaciones,
          total_adelanto_import: total_adelanto,
          total_plus_responsabilidad: total_plus_responsabilidad,
          capacitaciones: capacitaciones,
          plus_responsabilidad: newPlusResponsabilidad,
          total_hours_work_by_week: weeks,
          total_viaticos: total_viaticos,
          total_art_in_hours: total_art_in_hours,
          total_art_by_working_day: total_art_by_working_day,
          total_capacitation_hours: total_capacitation_hours,
          total_lic_sin_sueldo_days: total_lic_sin_sueldo_days,
          suspensiones: newsSuspension,
          lic_justificadas: newsLicJustificada,
          lic_justificada_group_by_reason: lic_justificada_group_by_reason,
          lic_no_justificadas: newsLicNoJustificada,
          arts: newsArt,
          presentismo: presentismo,
          embargos: newsEmbargos,
          feriados: newsFeriados,
          adelantos: newsAdelanto,
          vacaciones: newsVacaciones,
          licSinSueldo: newsLicSinSueldo,
          currentStatus: newsStatus
        } as IEmployeeLiquidation);
      }));// map employee
      liquidation.employee_liquidation = liquidations;
      const liq: ILiquidation  = await Liquidation.create(liquidation);
      await createMovement(req.user, 'creó', 'liquidación', `Liquidación desde ${fromDateMoment.format("DD_MM_YYYY")} hasta ${toDateMoment.format("DD_MM_YYYY")}`);
      return res.status(200).json(liq);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const liq: ILiquidation | null = await Liquidation.findOneAndDelete({_id: id});
      if(!liq) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrado', type: "RESOURCE_NOT_FOUND"});
      const fromDateMoment = moment(liq.dateFrom);
      const toDateMoment = moment(liq.dateTo);
      await createMovement(req.user, 'eliminó', 'liquidación', `Liquidación desde ${fromDateMoment.format("DD_MM_YYYY")} hasta ${toDateMoment.format("DD_MM_YYYY")}`);
      return res.status(200).json("liquidation deleted successfully");
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
