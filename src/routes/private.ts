import { Router, Request, Response } from 'express';

import { hasPermissionIn } from '../middlewares/roles.middleware';
// interfaces

// controllers

class PrivateRoutes{

  constructor(private router: Router = Router()){}

  public routes(): Router{
    // test route: only requires authentication
    // this.router.get('/test', (req: Request, res: Response): Response => {
    //   return res.status(200).json('test OK!');
    // });
    return this.router;
  }
}

const privateRoutes: PrivateRoutes = new PrivateRoutes();
export default privateRoutes.routes();
