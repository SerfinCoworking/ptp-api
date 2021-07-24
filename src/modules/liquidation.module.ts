import IEmployee from '../interfaces/employee.interface';
import ILiquidation, { IEmployeeLiq, IHoursByWeek, PeriodRangeDate } from '../interfaces/liquidation.interface';
import { IPeriod } from '../interfaces/schedule.interface';
import Employee from '../models/employee.model';
import Period from '../models/period.model';
import PeriodModule from './period.module';
import { buildWeeks } from '../utils/helpers';



export default class LiquidationModule {

  private range: PeriodRangeDate;
  private employeeIds: string;
  private periods: IPeriod[];
  private weeksBuilder: IHoursByWeek[];

  constructor(range: PeriodRangeDate, employeeIds: string){
    this.periods = [];
    this.weeksBuilder = buildWeeks(range.dateFrom, range.dateTo, {
      totalHours: 0,
      totalExtraHours: 0,
      events: []
    });
    this.range = range;
    this.employeeIds = employeeIds;
  }

  public async build(): Promise<ILiquidation>{
    this.periods = await this.scopePeriods(this.range);
    
    return await this.generateLiquidation(this.employeeIds, this.range);
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
  
  private async scopeEmployees(employeeIds: string): Promise<IEmployee[]> {      
    return await Employee.find({
      _id: { $in : employeeIds.split("_")}
    }).select("_id enrollment profile");
  }
  // Se obtienen las horas diurnas / nocturnas / totales / extras
  private async generateLiquidation(employeeIds: string, range: PeriodRangeDate): Promise<ILiquidation>{
    const employees: IEmployee[] = await this.scopeEmployees(employeeIds);
    const liq: ILiquidation = {
      dateFrom: range.dateFrom.format("DD-MM-YYYY"),
      dateTo: range.dateTo.format("DD-MM-YYYY"),
      liquidatedEmployees: []
    } as unknown as ILiquidation;
    liq.liquidatedEmployees = await Promise.all(employees.map( async (employee: IEmployee) => {
      const period = new PeriodModule(range, this.periods, JSON.parse(JSON.stringify(this.weeksBuilder)), JSON.parse(JSON.stringify(this.weeksBuilder)));
      return await period.liquidateEmployee(employee);
    }));
    return liq;
  }

}

