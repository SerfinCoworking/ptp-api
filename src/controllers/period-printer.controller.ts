import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import * as _ from 'lodash';
import EmployeePeriodCalendarParserModule from '../modules/employeePeriodCalendarParser.module';

class PeriodPrinterController extends BaseController{

  getPeriodPrinterParsed = async (req: Request, res: Response): Promise<Response<any>> => {
    const {id}  = req.params;
    const parser = new EmployeePeriodCalendarParserModule(id);
    const result = await parser.employeesGroupByWeeks();
    return res.json(result);
  }
}

export default new PeriodPrinterController();
