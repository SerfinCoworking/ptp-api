import moment from "moment";
import { ObjectId } from "mongodb";
import IEmployee from "../interfaces/employee.interface";
import { ILicReason, PeriodRangeDate } from "../interfaces/liquidation.interface";
import INews from "../interfaces/news.interface";
import { IEvent } from "../interfaces/schedule.interface";
import News from "../models/news.model";
import { sum } from "../utils/helpers";


export default class NewsModule {

  private queryByDate: any;
  private news = {
    feriado: 0,
    suspension: 0,
    lic_justificada: 0,
    lic_no_justificada: 0,
    art: 0,
    capacitaciones: 0
  }

  private hours_by_working_day: {
    lic_justificadas: string[],
    lic_no_justificas: string[],
    suspension: string[],
    art: string[]
  } = {
    lic_justificadas: [],
    lic_no_justificas: [],
    suspension: [],
    art: []
  };

  private total_of_news = {
    vaciones_by_days: 0,
    adelanto_import: 0,
    plus_responsabilidad: 0,
    lic_sin_sueldo_by_days: 0,
    presentismo: 100,
    embargo: 0
  };

  private total_viaticos = 0;
  private lic_justificada_group_by_reason: ILicReason[] = [
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
  private currentStatus = {};
  private liquidated_news = {};

  constructor(private events: IEvent[], private range: PeriodRangeDate){
    this.queryByDate = {          
      $or: [
      {
        $and: [
          { dateFrom: { $lte: range.dateFrom.format("YYYY-MM-DD") } },
          { dateTo: {$gte: range.dateFrom.format("YYYY-MM-DD") } }
        ]
      }, {
        $and: [
          { dateFrom: { $lte: range.dateTo.format("YYYY-MM-DD") } },
          { dateTo: {$gte: range.dateTo.format("YYYY-MM-DD") } }
        ]
      },{
        $and: [
          { dateFrom: { $gte: range.dateFrom.format("YYYY-MM-DD") } },
          { dateTo: {$lte: range.dateTo.format("YYYY-MM-DD") } }
        ]
      }]
    };
  }

  async buildNews(employee: IEmployee): Promise<{news: any, hours_by_working_day: any, total_of_news: any, lic_justificada_group_by_reason: any, liquidated_news: any}>{
    const feriados = await this.scopeFeriado(this.queryByDate);
    const suspensiones = await this.scopeNews(this.queryByDate, employee._id, "SUSPENSION");
    const lic_justificadas = await this.scopeNews(this.queryByDate, employee._id, "LIC_JUSTIFICADA");
    const lic_no_justificadas = await this.scopeNews(this.queryByDate, employee._id, "LIC_NO_JUSTIFICADA");
    const arts = await this.scopeNews(this.queryByDate, employee._id, "ART");
    const capacitaciones = await this.scopeNews(this.queryByDate, employee._id, "CAPACITACIONES");

    
    const queryVacaciones = {
      $and: [
        { dateFrom: { $gte: this.range.dateFrom.format("YYYY-MM-DD") } },
        { dateFrom: { $lte: this.range.dateTo.format("YYYY-MM-DD") } }
      ]};

    const vacaciones = await this.scopeNews(queryVacaciones, employee._id, "VACACIONES");
    const adelantos = await this.scopeNews(this.queryByDate, employee._id, "ADELANTO");
    const plus_responsabilidad = await this.scopeNews(this.queryByDate, employee._id, "PLUS_RESPONSABILIDAD");
    const embargos = await this.scopeNews(this.queryByDate, employee._id, "EMBARGO");

    const totalFeriado = await this.calcHours(this.events, feriados, 'minute');
    this.news.feriado = Math.round(totalFeriado / 60);
    this.news.suspension = await this.calcHours(this.events, suspensiones, 'hour', false);
    this.news.lic_justificada = await this.calcHours(this.events, lic_justificadas, 'hour', false);
    this.news.lic_no_justificada = await this.calcHours(this.events, lic_no_justificadas, 'hour', false);
    this.news.art = await this.calcHours(this.events, arts, 'hour', false);
    this.news.capacitaciones = await this.calcCapacitacionesHours(capacitaciones);
    

    this.hours_by_working_day.lic_justificadas = await this.calcWorkedDay(lic_justificadas, this.events);
    this.hours_by_working_day.lic_no_justificas = await this.calcWorkedDay(lic_no_justificadas, this.events);
    this.hours_by_working_day.suspension = await this.calcWorkedDay(suspensiones, this.events);
    this.hours_by_working_day.art = await this.calcWorkedDay(arts, this.events);

    this.total_of_news.adelanto_import = await sum(adelantos, 'import');
    this.total_of_news.plus_responsabilidad = await sum(plus_responsabilidad, 'import');
    this.total_of_news.vaciones_by_days = await this.sumDays(vacaciones);
    this.total_of_news.lic_sin_sueldo_by_days = await this.sumDays(plus_responsabilidad);
    //   embargo: 0
    await this.calcGroupByReason(lic_justificadas, this.events);
    this.total_viaticos = await this.calcViaticos(this.events);
    this.total_of_news.presentismo = await this.calcPresentimos(suspensiones.length, lic_no_justificadas.length, this.hours_by_working_day.lic_justificadas.length);
    this.total_of_news.embargo = embargos.length;
    this.liquidated_news = await this.getNews([
      ...suspensiones,
      ...lic_justificadas,
      ...lic_no_justificadas,
      ...arts,
      ...capacitaciones,
      ...vacaciones,
      ...adelantos,
      ...plus_responsabilidad,
      ...embargos
    ]);
    const result = {
      news: this.news,
      hours_by_working_day: this.hours_by_working_day,
      total_of_news: this.total_of_news,
      lic_justificada_group_by_reason: this.lic_justificada_group_by_reason,
      liquidated_news: this.liquidated_news
    }
    return  result;
  }

  private async calcHours(events: IEvent[], newsArr: INews[], diffBy: moment.unitOfTime.Diff, real:boolean = true): Promise<number>{
    let total:number = 0;
    await Promise.all(newsArr.map( async (news: INews) => {
      await Promise.all(events.map( async (event: IEvent) => {
        const from = real ? moment(event.checkin) : moment(event.fromDatetime);
        const to = real ? moment(event.checkout) : moment(event.toDatetime);
        // si el la fecha de incio del evento se encuentra comprendida por las fechas del feriado
        // entonces calculamos las horas 
        // a tener en cuenta: que hay que tomar los minutos y no solo las horas
        if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]") && to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
          total += to.diff(from, diffBy);
        }else if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
          // se agregar 1 dia mas ya que los minutos no los toma como hora
          const newsEnd = moment(news.dateTo).add(1, 'day').startOf('day');
          total += newsEnd.diff(from, diffBy);
        }else if(to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
          const newsStart = moment(news.dateFrom).startOf('day');
          total += to.diff(newsStart, diffBy);
        }
      }));
    }));
    return total;
  }

  private async calcCapacitacionesHours(newsArr: INews[]): Promise<number>{
    let total = 0;
    await Promise.all(newsArr.map((news: INews) => total += news.capacitationHours || 0));
    return total;
  }

  private async scopeFeriado(queryByDate: any): Promise<INews[]>{
    return await News.find({
      $and: [
        queryByDate,
        {
        "concept.key": "FERIADO"
        }
      ]
    });
  }
  
  private async scopeNews(queryByDate: any, employeeId: ObjectId, concept: string): Promise<INews[]>{
    return await News.find({
      $and: [
        queryByDate,
        {
        "concept.key": concept
        },
        {
          $or :[
            { "employee._id": employeeId },
            { "employeeMultiple": 
              { 
                $elemMatch: {
                _id: employeeId
                } 
              } 
            }
          ]
        }
      ]
    });
  }

  private async calcWorkedDay(news: INews[], events: IEvent[], real: boolean = false): Promise<Array<string>> {
    let target: Array<string> = []; 
    await Promise.all(news.map( async (news: INews) => {
      await Promise.all(events.map( async (event: IEvent) => {
        const from = real ? moment(event.checkin) : moment(event.fromDatetime);
        const to = real ? moment(event.checkout) : moment(event.toDatetime);        
        const isInDate: boolean = (
          (from.isBetween(news.dateFrom, news.dateTo, "date", "[]") && 
          to.isBetween(news.dateFrom, news.dateTo, "date", "[]")) ||
          (from.isBetween(news.dateFrom, news.dateTo, "date", "[]")) ||
          (to.isBetween(news.dateFrom, news.dateTo, "date", "[]"))
        )

        if(!target.includes(from.format("YYYY-MM-DD")) && isInDate){
          target.push(from.format("YYYY-MM-DD"));
        }                   
      }));
    }));
    return target;
  }
  
  private async sumDays(arr: INews[]): Promise<number>{
    let total: number = 0;
    await Promise.all(arr.map(( item: INews) => {
      const from: moment.Moment = moment(item.dateFrom);
      const to: moment.Moment = moment(item.dateTo);
      total += to.diff(from, 'days');
    }));
    return total;
  }

  private async calcGroupByReason(news: INews[], events: IEvent[]): Promise<void>{
    await Promise.all(news.map( async ( news: INews) => {
      await Promise.all(events.map( async (event: IEvent) => {
        const from = moment(event.fromDatetime);
        const to = moment(event.toDatetime);
        const isInDate: boolean = (
          (from.isBetween(news.dateFrom, news.dateTo, "date", "[]") && 
          to.isBetween(news.dateFrom, news.dateTo, "date", "[]")) ||
          (from.isBetween(news.dateFrom, news.dateTo, "date", "[]")) ||
          (to.isBetween(news.dateFrom, news.dateTo, "date", "[]"))
        )
        if(isInDate){
          await Promise.all(this.lic_justificada_group_by_reason.map((item) => {
            if(item.key.toUpperCase() === news.reason?.key.toUpperCase()){ 
              item.assigned_hours += to.diff(from, 'hours'); 
            }
          }));
        }
      }));
    }));
  }

  private async calcViaticos(events: IEvent[]): Promise<number>{
    const signedEvents: IEvent[] = events.filter(event => event.checkin);
    return signedEvents.length
  }

  private async calcPresentimos(totalSuspension: number, totalLicNoJus: number, totalLicJusJornadas: number): Promise<number>{
    let total: number = 100;
    if(totalSuspension > 0 || totalLicNoJus > 0){
      total = 0;
    }else if(totalLicJusJornadas > 1){
      if(totalLicJusJornadas == 2 ) total -= 10;
      if(totalLicJusJornadas == 3 ) total -= 20;
      if(totalLicJusJornadas > 3 ) total -= 30;
    }
    return total;
  }

  private async getNews(news: INews[]): Promise<ObjectId[]> {
    return await Promise.all(news.map((news: INews) => {
      return news._id;
    }));
  }
}
