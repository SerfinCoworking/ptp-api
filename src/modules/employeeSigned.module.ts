import{ PeriodRangeDate } from '../interfaces/liquidation.interface';
import { IPeriod, IShift } from '../interfaces/schedule.interface';
import Period from '../models/period.model';
import IEmployeeSigned, { ISignedByPeriod } from '../interfaces/employee-signed.interface.';
import EmployeeSigned from '../models/employee-signed.model';
import { ObjectId } from 'mongodb';

export default class EmployeeSignedModule {

  private range: PeriodRangeDate;
  private employeeId: string;
  private periods: IPeriod[];
  private employeeSigned: IEmployeeSigned;

  constructor(range: PeriodRangeDate, employeeId: string, private employee_liquidated_id: string){
    this.periods = [];
    this.range = range;
    this.employeeId = employeeId;
    this.employeeSigned = {} as IEmployeeSigned;
  }

  public async buildAndGet(): Promise<IEmployeeSigned>{
    let employeeSigned: IEmployeeSigned | null;
    employeeSigned = await EmployeeSigned.findOne({employee_liquidated_id: this.employee_liquidated_id});
    if(employeeSigned){
      this.employeeSigned = employeeSigned;
    }else{
      this.periods = await this.scopePeriodsByRangeAndEmployee(this.range, this.employeeId); 
      const signed_by_period: ISignedByPeriod[] = await this.getSignedsByPeriod(this.periods, this.employeeId);
      employeeSigned = {
        employee_liquidated_id: this.employee_liquidated_id,
        signed_by_period
      } as IEmployeeSigned;
      await this.saveEmployeeSigned(employeeSigned);
    }

    return this.getEmployeeSigned();
  }

  public getEmployeeSigned(): IEmployeeSigned{
    return this.employeeSigned;
  }

  private async saveEmployeeSigned(employeeSigned: IEmployeeSigned): Promise<void>{
    this.employeeSigned = await EmployeeSigned.create(employeeSigned);
  }

  private async scopePeriodsByRangeAndEmployee(range: PeriodRangeDate, empĺoyeeId: string): Promise<IPeriod[]>{
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
          }],
          shifts: 
          { 
            $elemMatch: {
              "employee._id": empĺoyeeId,
              signed: { $ne: null }
            },
          } 
        }]
      });
  }
  
  
  // Se obtienen las horas diurnas / nocturnas / totales / extras
  private async getSignedsByPeriod(periods: IPeriod[], employeeId: string): Promise<ISignedByPeriod[]>{
    const signeds: ISignedByPeriod[] = [];
    await Promise.all(periods.map((period: IPeriod) => {
      const shiftTarget: IShift | undefined = period.shifts.find((shift: IShift) => shift.employee._id.equals(employeeId));
      if(shiftTarget && shiftTarget.signed?.length){

        signeds.push({
          period_id: period._id.toString(),
          employee_id: shiftTarget.employee._id.toString(),
          signed: shiftTarget.signed,
          objective: {
            _id: period.objective._id.toString(),
            name: period.objective.name,
          }
       })
      }
    }));
    return signeds;
  }
}

