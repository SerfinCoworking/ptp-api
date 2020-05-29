import { Request, Response } from 'express';
import Shift from '../models/shift.model';
import IShift from '../interfaces/shift.interface';
import { BaseController } from '../interfaces/classes/base-controllers.interface';
import _ from 'lodash';

class ShiftController implements BaseController{

  public index = async (req: Request, res: Response): Promise<Response> => {
    const shifts: IShift[] = await Shift.find();
    return res.status(200).json({shifts});
  }

  public create = async (req: Request, res: Response): Promise<Response> => {
    const { fromDate, toDate} = req.body;
    const newShift: IShift = new Shift({
      fromDate,
      toDate,
    });
    try{
      await newShift.save();
      return res.status(200).json({ newShift });
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public show = async (req: Request, res: Response): Promise<Response> => {
    try{
      const id: string = req.params.id;
      const shift: IShift | null = await Shift.findOne({_id: id});
      return res.status(200).json(shift);
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public update = async (req: Request, res: Response) => {
    try{
      const id: string = req.params.id;
      const { fromDate, toDate } = req.body;
      await Shift.findByIdAndUpdate(id, {
        fromDate,
        toDate,
      });
      const shift = await Shift.findOne({_id: id});
      return res.status(200).json(shift);
    } catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public delete =  async (req: Request, res: Response): Promise<Response> => {
    try{

      const { id } = req.params;
      await Shift.findByIdAndDelete(id);
      return res.status(200).json('deleted');
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }
}

export default new ShiftController();
