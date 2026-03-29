import { createApp } from './app';
import { DiaryService } from './services/diaryService';

const start = async () => {
  const port = Number(process.env.PORT || 3001);
  const service = await DiaryService.create(process.env.DATABASE_URL);
  await service.bootstrap();

  const app = createApp(service);

  app.listen(port, () => {
    console.log(`Mental Diary API listening on port ${port}`);
  });
};

void start();