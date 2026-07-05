import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ShortcutsHelp } from './shortcuts-help';
import { ShortcutsService } from '../../services/shortcuts-service';

describe('ShortcutsHelp', () => {
  let component: ShortcutsHelp;
  let fixture: ComponentFixture<ShortcutsHelp>;
  let helpVisible$: BehaviorSubject<boolean>;
  let shortcutsSpy: jasmine.SpyObj<ShortcutsService>;

  beforeEach(async () => {
    helpVisible$ = new BehaviorSubject<boolean>(false);
    shortcutsSpy = jasmine.createSpyObj('ShortcutsService', ['closeHelp'], {
      helpVisible$,
      defs: [
        { combo: 'g h', label: 'Início', category: 'Navegação' },
        { combo: '/', label: 'Buscar', category: 'Busca' },
      ],
    });

    await TestBed.configureTestingModule({
      imports: [ShortcutsHelp],
      providers: [{ provide: ShortcutsService, useValue: shortcutsSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutsHelp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('builds groups from the shortcut definitions', () => {
    expect(component.groups.map(g => g.name)).toEqual(['Navegação', 'Busca']);
  });

  it('reflects helpVisible$ from the service', () => {
    helpVisible$.next(true);
    expect(component.visible).toBeTrue();
  });

  it('close delegates to ShortcutsService', () => {
    component.close();
    expect(shortcutsSpy.closeHelp).toHaveBeenCalled();
  });

  it('keys splits a combo string into individual keys', () => {
    expect(component.keys('g h')).toEqual(['g', 'h']);
  });
});
