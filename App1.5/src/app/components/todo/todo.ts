import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TareasService } from '../../services/tareas.service';
import { Tarea } from '../../models/tarea.model';
import { firstValueFrom } from 'rxjs';
import { TodoListComponent } from '../todo-list/todo-list';    //comentario
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, RouterModule, TodoListComponent,FormsModule],
  templateUrl: './todo.html',
})
export class TodoComponent implements OnInit {

  tareas = signal<Tarea[]>([]);
  mostrarSoloCompletadas = false;
  esVistaCompletadas = false;
  nomb = "*****";

  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';

  textoBusqueda: string = '';

  constructor(
    private tareasService: TareasService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    const url = this.router.url;

    this.esVistaCompletadas = url.includes('completadas');
    this.mostrarSoloCompletadas = this.esVistaCompletadas;

    if (isPlatformBrowser(this.platformId)) {
      const msg = sessionStorage.getItem('mensaje');
      if (msg) {
        this.mensaje = msg;
        this.tipoMensaje = 'success';
        setTimeout(() => this.mensaje = '', 5000);
        sessionStorage.removeItem('mensaje');
      }
    }

    this.cargarTareas();
  }

  async cargarTareas() {
    const data = await firstValueFrom(this.tareasService.obtenerTareas());
    this.tareas.set(data);
  }

  async eliminarTarea(id: number) {
    await firstValueFrom(this.tareasService.eliminarTarea(id));
    this.tareas.update(t => t.filter(t => t.id !== id));

    this.mensaje = 'Tarea eliminada correctamente';
    this.tipoMensaje = 'error';

    setTimeout(() => this.mensaje = '', 5000);
  }

  async marcarComoHecho(tarea: Tarea) {
    const tareaActualizada = {
      ...tarea,
      completada: !tarea.completada
    };

    await firstValueFrom(this.tareasService.actualizarTarea(tareaActualizada));

    this.tareas.update(lista =>
      lista.map(t => t.id === tarea.id ? tareaActualizada : t)
    );

    this.mensaje = tareaActualizada.completada
      ? 'Tarea completada'
      : 'Tarea desmarcada';

    this.tipoMensaje = 'success';

    setTimeout(() => this.mensaje = '', 5000);
  }

  editarTarea(tarea: Tarea) {
    this.router.navigate(['/editar', tarea.id]);
  }

  volver() {
    this.router.navigate(['/']);
  }

  get tareasFiltradas(): Tarea[] {
    return this.tareas()
      .filter(t =>
        (!this.mostrarSoloCompletadas || t.completada) &&
        (
          t.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase()) ||
          t.descripcion.toLowerCase().includes(this.textoBusqueda.toLowerCase())
        )
      );
  }
}