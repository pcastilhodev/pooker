import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ShortcutsHelp } from './shortcuts-help';
import { ShortcutsService, ShortcutDef } from '../../services/shortcuts-service';

const DEFS: ShortcutDef[] = [
  { combo: '?', label: 'Mostrar/ocultar este painel', category: 'Geral' },
  { combo: 'Esc', label: 'Fechar painéis/menus abertos', category: 'Geral' },
  { combo: '/', label: 'Focar busca', category: 'Busca' },
  { combo: 'g h', label: 'Ir para Início', category: 'Navegação' },
];

describe('ShortcutsHelp', () => {
  let component: ShortcutsHelp;
  let fixture: ComponentFixture<ShortcutsHelp>;
  let helpVisible$: BehaviorSubject<boolean>;
  let shortcutsSpy: jasmine.SpyObj<ShortcutsService>;

  beforeEach(async () => {
    helpVisible$ = new BehaviorSubject<boolean>(false);
    shortcutsSpy = jasmine.createSpyObj(
      'ShortcutsService',
      ['closeHelp'],
      { helpVisible$, defs: DEFS }
    );

    await TestBed.configureTestingModule({
      imports: [ShortcutsHelp],
      providers: [{ provide: ShortcutsService, useValue: shortcutsSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutsHelp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build groups from the shortcut defs on init, grouped by category and ordered', () => {
    expect(component.groups.map(g => g.name)).toEqual(['Navegação', 'Busca', 'Geral']);
    expect(component.groups.find(g => g.name === 'Geral')?.items.length).toBe(2);
    expect(component.groups.find(g => g.name === 'Busca')?.items.length).toBe(1);
    expect(component.groups.find(g => g.name === 'Navegação')?.items.length).toBe(1);
  });

  it('should omit categories with no matching shortcuts', () => {
    const onlyGeneral: ShortcutDef[] = [{ combo: '?', label: 'x', category: 'Geral' }];
    const svc = jasmine.createSpyObj('ShortcutsService', ['closeHelp'], {
      helpVisible$: new BehaviorSubject<boolean>(false),
      defs: onlyGeneral
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ShortcutsHelp],
      providers: [{ provide: ShortcutsService, useValue: svc }]
    });
    const f = TestBed.createComponent(ShortcutsHelp);
    f.detectChanges();
    expect(f.componentInstance.groups.map(g => g.name)).toEqual(['Geral']);
  });

  it('should reflect helpVisible$ emissions as visible', () => {
    expect(component.visible).toBeFalse();
    helpVisible$.next(true);
    expect(component.visible).toBeTrue();
    helpVisible$.next(false);
    expect(component.visible).toBeFalse();
  });

  it('should call shortcuts.closeHelp when close is called', () => {
    component.close();
    expect(shortcutsSpy.closeHelp).toHaveBeenCalled();
  });

  it('keys should split a combo string by spaces', () => {
    expect(component.keys('g h')).toEqual(['g', 'h']);
    expect(component.keys('?')).toEqual(['?']);
  });

  it('onEscape should close the panel when it is visible', () => {
    helpVisible$.next(true);
    component.onEscape();
    expect(shortcutsSpy.closeHelp).toHaveBeenCalled();
  });

  it('onEscape should do nothing when the panel is not visible', () => {
    helpVisible$.next(false);
    component.onEscape();
    expect(shortcutsSpy.closeHelp).not.toHaveBeenCalled();
  });

  it('should unsubscribe from helpVisible$ on destroy', () => {
    expect(helpVisible$.observers.length).toBe(1);
    fixture.destroy();
    expect(helpVisible$.observers.length).toBe(0);
  });
});
