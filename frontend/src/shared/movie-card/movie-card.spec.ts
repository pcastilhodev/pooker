import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieCard } from './movie-card';
import { FilmeModel } from '../../models/filme-model';
import { Router } from '@angular/router';
import { CollectionsService } from '../../services/collections-service';
import { CompareService } from '../../services/compare-service';
import { BehaviorSubject } from 'rxjs';

const mockFilm: FilmeModel = {
  id: 1, titulo: 'The Brutalist', genero: 'Drama', ano: new Date('2024-01-01'),
  preco_aluguel: 12.90, sinopse: 'Test', imagem_url: '', duracao_minutos: 215,
  classificacao_indicativa: '16', data_lancamento: new Date('2024-01-01'),
  total_copias: 10, diretor: 'Brady Corbet', copias_disponiveis: 5
};

describe('MovieCard', () => {
  let component: MovieCard;
  let fixture: ComponentFixture<MovieCard>;
  let routerSpy: jasmine.SpyObj<Router>;
  let collectionsSpy: jasmine.SpyObj<CollectionsService>;
  let compareSpy: jasmine.SpyObj<CompareService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    collectionsSpy = jasmine.createSpyObj('CollectionsService', ['getAll', 'addFilm'], {
      collections$: new BehaviorSubject([]).asObservable()
    });
    collectionsSpy.getAll.and.returnValue([]);
    compareSpy = jasmine.createSpyObj('CompareService', ['isSelected', 'add', 'remove'], {
      idsObs$: new BehaviorSubject<number[]>([]).asObservable()
    });
    compareSpy.isSelected.and.returnValue(false);
    await TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CollectionsService, useValue: collectionsSpy },
        { provide: CompareService, useValue: compareSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovieCard);
    component = fixture.componentInstance;
    component.film = mockFilm;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should display film title', () => {
    expect(fixture.nativeElement.querySelector('.card-name').textContent.trim()).toBe('The Brutalist');
  });

  it('should navigate to film detail on click', () => {
    fixture.nativeElement.querySelector('.browse-card').click();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie/1']);
  });

  it('should use gradient SVG when imagem_url is empty', () => {
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should use img when imagem_url is set', () => {
    component.film = { ...mockFilm, imagem_url: 'https://example.com/poster.jpg' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
  });

  it('palette cycles based on the film id', () => {
    component.film = { ...mockFilm, id: 7 };
    expect(component.palette).toEqual({ c1: '#0d1520', c2: '#153050' });
  });

  it('addToFirstCollection stops propagation and adds to the first collection', () => {
    collectionsSpy.getAll.and.returnValue([{ id: 'c1', name: 'X', filmIds: [], createdAt: '' }]);
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);

    component.addToFirstCollection(evt);

    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(collectionsSpy.addFilm).toHaveBeenCalledWith('c1', 1);
  });

  it('addToFirstCollection navigates to collections page when there are none', () => {
    collectionsSpy.getAll.and.returnValue([]);
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);

    component.addToFirstCollection(evt);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/colecoes']);
    expect(collectionsSpy.addFilm).not.toHaveBeenCalled();
  });

  it('toggleCompare adds the film when not selected', () => {
    compareSpy.isSelected.and.returnValue(false);
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);

    component.toggleCompare(evt);

    expect(evt.stopPropagation).toHaveBeenCalled();
    expect(compareSpy.add).toHaveBeenCalledWith(1);
  });

  it('toggleCompare removes the film when already selected', () => {
    compareSpy.isSelected.and.returnValue(true);
    const evt = jasmine.createSpyObj('Event', ['stopPropagation']);

    component.toggleCompare(evt);

    expect(compareSpy.remove).toHaveBeenCalledWith(1);
  });
});
