import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import Employee from '../models/employee.model';
import IEmployee from '../interfaces/employee.interface';

class EmployeeController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
    try{
      const employees: IEmployee[] = await Employee.find();
      return res.status(200).json(employees);
    }catch(err){
      console.log(err);
      return res.status(500).json("Server Error");
    }
  }

  create = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const body: IEmployee = await this.filterNullValues(req.body, this.permitBody());
    try{
      const employee: IEmployee = await Employee.create(body);
      return res.status(200).json(employee);
    }catch(err){
      console.log(err);
      return res.status(500).json("Server Error");
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const id: string = req.params.id;
    try{
      const employee: IEmployee | null = await Employee.findOne({_id: id});
      if(!employee) return res.status(400).json("Employee not found");
      return res.status(200).json(employee);
    }catch(err){
      console.log(err);
      return res.status(500).json("Server Error");
    }
  }

  update = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true };
      const employee: IEmployee | null = await Employee.findOneAndUpdate({_id: id}, body, opts);
      if(!employee) return res.status(400).json("Employee not found");
      return res.status(200).json(employee);
    }catch(err){
      console.log(err);
      return res.status(500).json("Server Error");
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Employee.findByIdAndDelete(id);
      return res.status(200).json("Employee deleted successfully");
    }catch(err){
      console.log(err);
      return res.status(500).json("Server Error");
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'enrollment', 'profile', 'contact' ];
  }
}

export default new EmployeeController();
