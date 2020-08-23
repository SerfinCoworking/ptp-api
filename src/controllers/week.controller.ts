import { Request, Response } from 'express';
import Week from '../models/week.model';
import IWeek from '../interfaces/week.interface';
import { BaseController } from '../interfaces/classes/base-controllers.interface';
import _ from 'lodash';

class WeekController implements BaseController{

  public index = async (req: Request, res: Response): Promise<Response> => {
    const weeks: IWeek[] = await Week.find();
    return res.status(200).json({weeks});
  }

  public create = async (req: Request, res: Response): Promise<Response> => {
    const { fromDay, toDay} = req.body;
    const newWeek: IWeek = new Week({
      fromDay,
      toDay,
    });
    try{
      await newWeek.save();
      return res.status(200).json({ newWeek });
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public show = async (req: Request, res: Response): Promise<Response> => {
    try{
      const id: string = req.params.id;
      const week: IWeek | null = await Week.findOne({_id: id});
      return res.status(200).json(week);
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public update = async (req: Request, res: Response) => {
    try{
      const id: string = req.params.id;
      const { fromDay, toDay } = req.body;
      await Week.findByIdAndUpdate(id, {
        fromDay,
        toDay,
      });
      const week = await Week.findOne({_id: id});
      return res.status(200).json(week);
    } catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public delete =  async (req: Request, res: Response): Promise<Response> => {
    try{

      const { id } = req.params;
      await Week.findByIdAndDelete(id);
      return res.status(200).json('deleted');
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }
}

export default new WeekController();
