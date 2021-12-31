import moment from 'moment';
import IEmployee from '../interfaces/employee.interface';
import INews from '../interfaces/news.interface';
import Employee from '../models/employee.model';
import News from '../models/news.model';

export default class EmployeeStatusModule {
  
  constructor(private employee: IEmployee, private dateFrom: string, private oldEmployee?: IEmployee | null | undefined){}

  async update(): Promise<void>{
    if(this.oldEmployee && !this.oldEmployee._id.equals(this.employee._id)){
      this.oldEmployee.status = "ACTIVO";
      await this.oldEmployee.save();
    }

    const today = moment();
    // Cargo una baja antigua: cambio de estado automaticamente a BAJA
    if ( today.isAfter(this.dateFrom)){
      this.employee.status = "BAJA";
      await this.employee.save();
    }else{
      this.employee.status = "PRE_BAJA";
      await this.employee.save();
    }
  }
}

export const cronEmployeeSetBaja =  async (): Promise<void> => {
  const toDay = moment();
  // Buscamos todas las novedades BAJA del dia actual
  const news: INews[] = await News.find({
    'concept.key': 'BAJA',
    'dateFrom': {
      $eq: toDay.format("YYYY-MM-DD")
    }
  });

  // Por cada novedad BAJA, buscamos al empleado relacionado
  // y le actualizamos su estado a BAJA
  await Promise.all(news.map( async (newsToUpdate: INews) => {
    await Employee.findOneAndUpdate({_id: newsToUpdate.employee?._id}, {status: 'BAJA'});
  }));
}

