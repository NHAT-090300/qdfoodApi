import { NextFunction, Request, Response } from 'express';
import { Context } from 'api';

import cities from '@constants/cities.json';
import districts from '@constants/districts.json';
import wards from '@constants/wards.json';

export async function getLocation(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({
      cities,
      districts,
      wards,
    });
  } catch (error) {
    next(error);
  }
}
