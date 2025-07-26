export enum ESortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export enum ERole {
  SUPPER = 'SUPPER',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum EDirections {
  EAST = 'East',
  WEST = 'West',
  SOUTH = 'South',
  NORTH = 'North',
  SOUTH_EAST = 'SouthEast',
  SOUTH_WEST = 'SouthWest',
  NORTH_EAST = 'NorthEast',
  NORTH_WEST = 'NorthWest',
}

export enum EOrderStatus {
  PENDING = 'PENDING',
  SHIPPING = 'SHIPPING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  CONFIRM = 'CONFIRM',
}

export enum EInventoryTransactionType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  RETURN_DAMAGED = 'RETURN_DAMAGED',
}
