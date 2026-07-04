import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPanel } from './filter-panel';
import { FilmeModel } from '../../models/filme-model';
import { FilterService, FilmFilters } from '../../services/filter-service';

const mockFilm: FilmeModel = {
  id: 1, titulo: 'The Brutalist', genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 12.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 215,
  classificacao_indicativa: '16', data_lancamento: new Date('2024-01-01'),
  total_copias: 10, diretor: 'Brady Corbet', copias_disponiveis: 5
};

function emptyFilters(): FilmFilters {
  return {
    generos: [], minAno: 0, maxAno: 9999,
    minPreco: 0, maxPreco: 9999,
    minDuracao: 0, maxDuracao: 9999,
    apenasDisponivel: false
  };
}

describe('FilterPanel', () => {
  let component: FilterPanel;
  let fixture: ComponentFixture<FilterPanel>;
  let filterServiceSpy: jasmine.SpyObj<FilterService>;

  beforeEach(async () => {
    filterServiceSpy = jasmine.createSpyObj('FilterService', ['empty', 'extractGenres', 'bounds']);
    filterServiceSpy.empty.and.returnValue(emptyFilters());
    filterServiceSpy.extractGenres.and.returnValue(['Comedy', 'Drama']);
    filterServiceSpy.bounds.and.returnValue({ minAno: 2000, maxAno: 2024, maxPreco: 40, maxDuracao: 200 });

    await TestBed.configureTestingModule({
      imports: [FilterPanel],
      providers: [{ provide: FilterService, useValue: filterServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanel);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize filters from filterService.empty() in the constructor', () => {
    expect(filterServiceSpy.empty).toHaveBeenCalled();
    expect(component.filters).toEqual(emptyFilters());
  });

  describe('ngOnChanges', () => {
    it('should do nothing when films is empty', () => {
      component.films = [];
      component.ngOnChanges();
      expect(filterServiceSpy.extractGenres).not.toHaveBeenCalled();
      expect(filterServiceSpy.bounds).not.toHaveBeenCalled();
    });

    it('should populate genres, bounds and filters on first change with films', () => {
      component.films = [mockFilm];
      component.ngOnChanges();

      expect(filterServiceSpy.extractGenres).toHaveBeenCalledWith([mockFilm]);
      expect(filterServiceSpy.bounds).toHaveBeenCalledWith([mockFilm]);
      expect(component.genres).toEqual(['Comedy', 'Drama']);
      expect(component.bounds).toEqual({ minAno: 2000, maxAno: 2024, maxPreco: 40, maxDuracao: 200 });
      expect(component.filters.maxAno).toBe(2024);
      expect(component.filters.minAno).toBe(2000);
      expect(component.filters.maxPreco).toBe(40);
      expect(component.filters.maxDuracao).toBe(200);
    });

    it('should not reset filters on subsequent changes once initialized', () => {
      component.films = [mockFilm];
      component.ngOnChanges();

      component.toggleGenre('Drama');
      expect(component.filters.generos).toEqual(['Drama']);

      filterServiceSpy.bounds.and.returnValue({ minAno: 1990, maxAno: 2030, maxPreco: 100, maxDuracao: 300 });
      component.films = [mockFilm, { ...mockFilm, id: 2, genero: 'Comedy' }];
      component.ngOnChanges();

      expect(component.bounds).toEqual({ minAno: 1990, maxAno: 2030, maxPreco: 100, maxDuracao: 300 });
      expect(component.filters.generos).toEqual(['Drama']);
      expect(component.filters.maxAno).toBe(2024);
    });
  });

  describe('toggleGenre', () => {
    beforeEach(() => {
      component.films = [mockFilm];
      component.ngOnChanges();
    });

    it('should add a genre when not currently selected and emit', () => {
      spyOn(component.filtersChange, 'emit');
      component.toggleGenre('Drama');
      expect(component.filters.generos).toEqual(['Drama']);
      expect(component.filtersChange.emit).toHaveBeenCalledWith(jasmine.objectContaining({ generos: ['Drama'] }));
    });

    it('should remove a genre when already selected and emit', () => {
      component.toggleGenre('Drama');
      spyOn(component.filtersChange, 'emit');
      component.toggleGenre('Drama');
      expect(component.filters.generos).toEqual([]);
      expect(component.filtersChange.emit).toHaveBeenCalledWith(jasmine.objectContaining({ generos: [] }));
    });
  });

  describe('emit', () => {
    it('should emit a copy of the current filters', () => {
      spyOn(component.filtersChange, 'emit');
      component.emit();
      expect(component.filtersChange.emit).toHaveBeenCalledWith(component.filters);
    });
  });

  describe('activeCount', () => {
    beforeEach(() => {
      component.films = [mockFilm];
      component.ngOnChanges();
    });

    it('should be 0 when no filters are active', () => {
      expect(component.activeCount).toBe(0);
    });

    it('should count selected genres', () => {
      component.toggleGenre('Drama');
      expect(component.activeCount).toBe(1);
    });

    it('should count apenasDisponivel when true', () => {
      component.filters = { ...component.filters, apenasDisponivel: true };
      expect(component.activeCount).toBe(1);
    });

    it('should count maxPreco when below the bounds maximum', () => {
      component.filters = { ...component.filters, maxPreco: component.bounds.maxPreco - 1 };
      expect(component.activeCount).toBe(1);
    });

    it('should sum all active filter categories', () => {
      component.toggleGenre('Drama');
      component.filters = { ...component.filters, apenasDisponivel: true, maxPreco: component.bounds.maxPreco - 1 };
      expect(component.activeCount).toBe(3);
    });
  });

  describe('reset', () => {
    it('should restore filters to bounds-based defaults and emit', () => {
      component.films = [mockFilm];
      component.ngOnChanges();
      component.toggleGenre('Drama');
      component.filters = { ...component.filters, apenasDisponivel: true };

      spyOn(component.filtersChange, 'emit');
      component.reset();

      expect(component.filters.generos).toEqual([]);
      expect(component.filters.apenasDisponivel).toBe(false);
      expect(component.filters.maxAno).toBe(component.bounds.maxAno);
      expect(component.filtersChange.emit).toHaveBeenCalledWith(component.filters);
    });
  });

  describe('template interactions', () => {
    it('should toggle the panel open state when the filter-toggle button is clicked', () => {
      fixture.detectChanges();
      const toggleBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.filter-toggle');
      expect(component.open).toBe(false);
      toggleBtn.click();
      expect(component.open).toBe(true);
    });
  });
});
