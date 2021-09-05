import moment from 'moment';
import IEmployee from '../interfaces/employee.interface';
import INews from '../interfaces/news.interface';

export default class EmployeeStatusModule {
  
  constructor(private employee: IEmployee, private news: INews, private oldEmployee?: IEmployee | null | undefined){}

  async update(): Promise<void>{
    if(this.oldEmployee && !this.oldEmployee._id.equals(this.employee._id)){
      this.oldEmployee.status = "ACTIVO";
      await this.oldEmployee.save();
    }

    const today = moment();
    // Cargo una baja antigua: cambio de estado automaticamente a BAJA
    if ( today.isAfter(this.news.dateFrom)){
      this.employee.status = "BAJA";
      await this.employee.save();
    }else{
      this.employee.status = "PRE_BAJA";
      await this.employee.save();
    }
  }
}

