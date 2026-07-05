import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPanel } from './filter-panel';
import { FilmeModel } from '../../models/filme-model';

const f = (id: number, genero: string, ano: number, preco: number, dur: number): FilmeModel => ({
  id, titulo: `F${id}`, genero, ano: new Date(ano, 0, 1), preco_aluguel: preco,
  sinopse: '', imagem_url: '', duracao_minutos: dur, classificacao_indicativa: '12',
  data_lancamento: new Date(ano, 0, 1), total_copias: 5, diretor: 'D', copias_disponiveis: 3,
});

describe('FilterPanel', () => {
  let component: FilterPanel;
  let fixture: ComponentFixture<FilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterPanel] }).compileComponents();
    fixture = TestBed.createComponent(FilterPanel);
    component = fixture.componentInstance;
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('ngOnChanges does nothing when there are no films', () => {
    component.films = [];
    component.ngOnChanges();
    expect(component.genres).toEqual([]);
  });

  it('ngOnChanges extracts genres and bounds from the given films', () => {
    component.films = [f(1, 'Ação', 2010, 10, 90), f(2, 'Drama', 2020, 20, 150)];
    component.ngOnChanges();

    expect(component.genres).toEqual(['Ação', 'Drama']);
    expect(component.bounds.minAno).toBe(2010);
    expect(component.bounds.maxAno).toBe(2020);
    expect(component.filters.maxPreco).toBe(20);
  });

  it('toggleGenre adds and removes a genre, emitting the new filters', () => {
    component.films = [f(1, 'Ação', 2010, 10, 90)];
    component.ngOnChanges();

    let emitted: any;
    component.filtersChange.subscribe(v => (emitted = v));

    component.toggleGenre('Ação');
    expect(component.filters.generos).toContain('Ação');
    expect(emitted.generos).toContain('Ação');

    component.toggleGenre('Ação');
    expect(component.filters.generos).not.toContain('Ação');
  });

  it('activeCount reflects active filters', () => {
    component.films = [f(1, 'Ação', 2010, 10, 90)];
    component.ngOnChanges();
    component.toggleGenre('Ação');
    component.filters.apenasDisponivel = true;

    expect(component.activeCount).toBeGreaterThanOrEqual(2);
  });

  it('reset restores filters to the film bounds and emits', () => {
    component.films = [f(1, 'Ação', 2010, 10, 90)];
    component.ngOnChanges();
    component.toggleGenre('Ação');

    let emitted: any;
    component.filtersChange.subscribe(v => (emitted = v));
    component.reset();

    expect(component.filters.generos).toEqual([]);
    expect(emitted.generos).toEqual([]);
  });
});
