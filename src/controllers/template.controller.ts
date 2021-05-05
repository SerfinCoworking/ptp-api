import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Template from '../models/template.model';
import ITemplate from '../interfaces/template.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import { createMovement } from '../utils/helpers';


class TemplateController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ITemplate[]>> => {
    const { search, page, limit, sort } = req.query;
    
    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"name": 1});
    
    try{
      const query = {
        $or: [
          {"name":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
      };
      
      const templates: PaginateResult<ITemplate> = await Template.paginate(query, options);
      return res.status(200).json(templates);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<ITemplate>> => {
    const body: ITemplate = await this.filterNullValues(req.body, this.permitBody());
    try{
      const template: ITemplate = await Template.create({...body});
      await createMovement(req.user, 'creó', 'template', `${Template.name}`);
      return res.status(200).json(template);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ITemplate>> => {
    const id: string = req.params.id;
    try{
      const template: ITemplate | null = await Template.findOne({_id: id});
      if(!template) throw new GenericError({property:"Template", message: 'Template no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(template);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<ITemplate>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, this.permitBody());

    try{
      const opts: any = { runValidators: true, new: true, context: 'query' };
      const template: ITemplate | null = await Template.findOneAndUpdate({_id: id}, body, opts);
      if(!template) throw new GenericError({property:"Template", message: 'Template no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'editó', 'template', `${Template.name}`);
      return res.status(200).json(template);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const template: ITemplate | null = await Template.findOneAndDelete({_id: id});
      if(!template) throw new GenericError({property:"Template", message: 'Template no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'template', `${Template.name}`);
      return res.status(200).json("Template deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'name', 'schedule'];
  }
}

export default new TemplateController();
