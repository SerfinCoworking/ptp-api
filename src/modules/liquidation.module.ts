import IEmployee from '../interfaces/employee.interface';
import ILiquidation, { IHoursByWeek, PeriodRangeDate } from '../interfaces/liquidation.interface';
import { IPeriod } from '../interfaces/schedule.interface';
import Employee from '../models/employee.model';
import Period from '../models/period.model';
import PeriodModule from './period.module';
import { buildWeeks } from '../utils/helpers';
import Liquidation from '../models/liquidation.model';
import LiquidatedNews from '../models/liquidated-news.model';
import EmployeeLiquidated from '../models/employee-liquidated.documents';
import EmployeeSigned from '../models/employee-signed.model';

export default class LiquidationModule {

  private range: PeriodRangeDate;
  private employeeIds: Array<string>;
  private periods: IPeriod[];
  private weeksBuilder: IHoursByWeek[];
  private liquidation: ILiquidation;

  constructor(range: PeriodRangeDate, employeeIds: Array<string>){
    this.periods = [];
    this.weeksBuilder = buildWeeks(range.dateFrom, range.dateTo, {
      totalHours: 0,
      totalExtraHours: 0,
      events: []
    });
    this.range = range;
    this.employeeIds = employeeIds;
    this.liquidation = {} as ILiquidation;
  }

  public async buildAndSave(_id?: string): Promise<void>{
    this.periods = await this.scopePeriods(this.range); 
    const liquidation: ILiquidation = await this.generateLiquidation(this.employeeIds, this.range);
    await this.saveLiquidation(liquidation, _id);
  }

  public getLiquidation(): ILiquidation{
    return this.liquidation;
  }
  
  public async destroyLiquidation(liq: ILiquidation): Promise<{dateFrom: string, dateTo: string}>{
    
    await Promise.all(liq.liquidatedEmployees.map( async (employeeLiq) => {
      await LiquidatedNews.findOneAndDelete({ _id: employeeLiq.liquidated_news_id});
    }));

    const employeeLiquidateds = await EmployeeLiquidated.find({liquidation_id: liq._id});
    await Promise.all(employeeLiquidateds.map( async (eLiquidated) =>{
      await EmployeeSigned.findOneAndDelete({ employee_liquidated_id: eLiquidated._id});
    }));

    await EmployeeLiquidated.deleteMany({liquidation_id: liq._id});
    
    return {dateFrom: liq.dateFrom, dateTo: liq.dateTo};
  }

  private async saveLiquidation(liquidation: ILiquidation, _id?: string): Promise<void>{
    if(_id){
      const liquidated: ILiquidation | null = await Liquidation.findOneAndUpdate({_id}, liquidation);
      if (liquidated){
        await this.destroyLiquidation(liquidated);
        this.liquidation = liquidated;
      }
    }else{
      this.liquidation = await Liquidation.create(liquidation);
    }
  }

  private async scopePeriods(range: PeriodRangeDate): Promise<IPeriod[]>{
    // buscamos el periodo por rango de fechas y filtramos por id de empleado
    return await Period.find(
      {
        $and: [{
          $or: [
          {
            $and: [
              { fromDate: { $lte: range.dateFrom.format("YYYY-MM-DD") } },
              { toDate: {$gte: range.dateFrom.format("YYYY-MM-DD") } }
            ]
          }, {
            $and: [
              { fromDate: { $lte: range.dateTo.format("YYYY-MM-DD") } },
              { toDate: {$gte: range.dateTo.format("YYYY-MM-DD") } }
            ]
          },{
            $and: [
              { fromDate: { $gte: range.dateFrom.format("YYYY-MM-DD") } },
              { toDate: {$lte: range.dateTo.format("YYYY-MM-DD") } }
            ]
          }]
        }]
      });
  }
  
  private async scopeEmployees(employeeIds: Array<string>): Promise<IEmployee[]> {      
    return await Employee.find({
      _id: { $in : employeeIds}
    }).select("_id enrollment profile status");
  }
  // Se obtienen las horas diurnas / nocturnas / totales / extras
  private async generateLiquidation(employeeIds: Array<string>, range: PeriodRangeDate): Promise<ILiquidation>{
    const employees: IEmployee[] = await this.scopeEmployees(employeeIds);
    const liq: ILiquidation = {
      dateFrom: range.dateFrom.format("YYYY-MM-DD"),
      dateTo: range.dateTo.format("YYYY-MM-DD"),
      status: "IN_PROCESS",
      liquidatedEmployees: []
    } as unknown as ILiquidation;
    liq.liquidatedEmployees = await Promise.all(employees.map( async (employee: IEmployee) => {
      const period = new PeriodModule(range, this.periods, JSON.parse(JSON.stringify(this.weeksBuilder)), JSON.parse(JSON.stringify(this.weeksBuilder)));
      return await period.liquidateEmployee(employee);
    }));
    return liq;
  }
}

