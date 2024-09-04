import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'remainingTime',
  standalone: true,
})
export class RemainingTimePipe implements PipeTransform {
  transform(seconds: number): string {
    const minutes: number = Math.floor(seconds / 60);
    const remainingSeconds: number = seconds % 60;

    const minutesString: string = minutes < 10 ? '0' + minutes : minutes.toString();
    const secondsString: string = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();

    return `${minutesString}:${secondsString}`;
  }
}
