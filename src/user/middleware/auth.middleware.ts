import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

import { ExpressRequestInterface } from './../types/expressRequest.interface';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService
  ) {}

  async use(req: ExpressRequestInterface, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization;
    const accessTokenSecret = this.configService.get('accessTokenSecret');

    try {
      const decode = verify(token, accessTokenSecret) as UserEntity;
      const user = await this.userService.findById(decode.id);
      req.user = user;
      next();
    } catch (err) {
      req.user = null;
      next();
    }
  }
}

// @Injectable()
// export class AuthMiddleware implements NestMiddleware {
//   constructor(
//     private readonly userService: UserService,
//     private configService: ConfigService
//   ) {}

//   async use(req: ExpressRequestInterface, res: Response, next: NextFunction) {
//     try {
//       const token = req.headers.authorization;

//       if (!token) {
//         return res.status(400).json({ msg: 'Invalid authentication' });
//       }

//       const accessTokenSecret = this.configService.get('accessTokenSecret');

//       verify(token, accessTokenSecret, (err, user: UserEntity) => {
//         if (err) {
//           return res.status(400).json({ msg: 'Invalid authentication' });
//         }
//         req.user = user;
//         next();
//       });
//     } catch (err) {
//       return res.status(500).json({ msg: err.message });
//     }
//   }
// }
