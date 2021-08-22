import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import NewsConcept from '../models/news-concept.model';
import { INewsConcept } from '../interfaces/news.interface';

class NewsConceptController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INewsConcept[]>> => {
    try{
      const newsConcepts: INewsConcept[] = await NewsConcept.find({
        key: {
          $nin: ['ALTA', 'ACTIVO']
        }
      }).select('_id name key');
      return res.status(200).json(newsConcepts);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<INewsConcept>> => {
    const body: INewsConcept = await this.filterNullValues(req.body, this.permitBody());
    try{
      const newsConcept: INewsConcept = await NewsConcept.create(body);
      return res.status(200).json(newsConcept);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<INewsConcept>> => {
    const id: string = req.params.id;
    try{
      const newsConcept: INewsConcept | null = await NewsConcept.findOne({_id: id});
      if(!newsConcept) throw new GenericError({property:"NewsConcept", message: 'Concepto de novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(newsConcept);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<INewsConcept>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true };
      const newsConcept: INewsConcept | null = await NewsConcept.findOneAndUpdate({_id: id}, body, opts);
      if(!newsConcept) throw new GenericError({property:"NewsConcept", message: 'Concepto novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(newsConcept);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await NewsConcept.findByIdAndDelete(id);
      return res.status(200).json("concepto de novedad eliminado");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return ['name', 'key'];
  }
}

export default new NewsConceptController();
