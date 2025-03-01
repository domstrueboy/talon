import QRCode from 'qrcode';

export function generateTrainerQR(trainerId: number): Promise<void> {
  return QRCode.toFile('./trainer.png', `t.me/YourBot?start=trainer${trainerId}`);
}