import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization -- intentional URL pipe
  transform(url: string) { return this.sanitizer.bypassSecurityTrustResourceUrl(url); }
}
