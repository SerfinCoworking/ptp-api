import { Request, Response } from 'express';
import moment from 'moment';
import { errorHandler, GenericError } from '../common/errors.handler';
import IEmployeeSigned from '../interfaces/employee-signed.interface.';
import EmployeeSigned from '../models/employee-signed.model';
import EmployeeSignedModule from '../modules/employeeSigned.module';
import { BaseController } from './base.controllers.interface';

class EmployeeSignedController extends BaseController{

  getEmployeeSigneds = async (req: Request, res: Response): Promise<Response<IEmployeeSigned | null>> => {   
    const {fromDate, toDate, employeeId, employee_liquidated_id} = req.query;
    try{
      const dateFrom = moment(fromDate, "DD-MM-YYYY").startOf('day');
      const dateTo = moment(toDate, "DD-MM-YYYY").endOf('day');
      const employeeSigned = new EmployeeSignedModule({dateFrom, dateTo}, employeeId, employee_liquidated_id);
      await employeeSigned.buildAndGet();
      return res.status(200).json(employeeSigned);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }


}

export default new EmployeeSignedController();
