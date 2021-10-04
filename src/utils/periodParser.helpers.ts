import { ObjectId } from "mongodb";
import INews from "../interfaces/news.interface";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import News from "../models/news.model";
import Period from "../models/period.model";

export const otherEvents = async (periodId: ObjectId | undefined, dateFrom: string, dateTo: string, employee: any): Promise<Array<IEvent>> =>{
  const events: Array<IEvent> = [];
  const query: Array<any> = [{
    $or: [
    {
      $and: [
        { fromDate: { $lte: dateFrom } },
        { toDate: {$gte: dateFrom } }
      ]
    }, {
      $and: [
        { fromDate: { $lte: dateTo } },
        { toDate: {$gte: dateTo } }
      ]
    },{
      $and: [
        { fromDate: { $gte: dateFrom } },
        { toDate: {$lte: dateTo } }
      ]
    }]}, {
      shifts: {
        $elemMatch: {
          $and: [
            { 'employee._id': { $eq: employee._id } },
            { 
              events: {
                $elemMatch: {
                  $or: [
                    {
                      $and: [
                        { fromDatetime: { $lte: dateFrom } },
                        { toDatetime: {$gte: dateFrom } }
                      ]
                    }, {
                      $and: [
                        { fromDatetime: { $lte: dateTo } },
                        { toDatetime: {$gte: dateTo } }
                      ]
                    },{
                      $and: [
                        { fromDatetime: { $gte: dateFrom } },
                        { toDatetime: {$lte: dateTo } }
                      ]
                    }]
                }
              }
            }
          ]              
        }
      }
    }];

    if(!!periodId){
      query.push({
        _id: { $ne: periodId }
      });
    }
  const periods: Array<IPeriod> = await Period.find({
    $and: query
  });

  await Promise.all(periods.map( async (period: IPeriod) => {
    await Promise.all(period.shifts.map( async (shift: IShift) => {
      if(shift.employee._id.equals(employee._id)){
        await Promise.all(shift.events.map((ev: IEvent) => {
          events.push(ev);
        }));
      }
    }));
  }));

  return events;
}

export const getNews = async (employeeId: ObjectId, dateFrom: string, dateTo: string): Promise<Array<INews>> => {
  return await News.find({
    $and: [
      {
        $or: [
          {
            $and: [
              { dateFrom: { $lte: dateFrom } },
              { dateTo: { $gte: dateFrom } }
            ]
          }, {
            $and: [
              { dateFrom: { $lte: dateTo } },
              { dateTo: { $gte: dateTo } }
            ]
          },{
            $and: [
              { dateFrom: { $gte: dateFrom } },
              { dateTo: { $lte: dateTo } }
            ]
          }
        ]
      },
      {
        $or: [
          {
            $and: [{
              'concept.key': { $in: [
                'BAJA',
                'LIC_JUSTIFICADA',
                'VACACIONES',
                'LIC_NO_JUSTIFICADA',
                'ART',
                'SUSPENSION',
                'LIC_SIN_SUELDO'
              ]},
              'employee._id': { $eq: employeeId }
            }]
          }
        ]
      }
    ]      
  }).select('concept dateFrom dateTo employee._id');
}