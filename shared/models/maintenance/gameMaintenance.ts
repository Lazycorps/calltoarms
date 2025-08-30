export class GameMaintenanceDTO {
  id: number = 0;
  title: string = "";
  description?: string;
  releaseDate?: Date;
  imageUrl?: string;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  // Statistiques pour la maintenance
  notificationCount?: number = 0;
}

export class GameCreateDTO {
  title: string = "";
  description?: string;
  releaseDate?: Date;
  imageUrl?: string;
}

export class GameUpdateDTO {
  id: number = 0;
  title?: string;
  description?: string;
  releaseDate?: Date;
  imageUrl?: string;
}
