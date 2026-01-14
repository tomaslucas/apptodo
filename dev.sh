#!/bin/bash
# dev.sh - Script para gestionar servicios de desarrollo
# Uso: ./dev.sh [comando] [servicio]
#
# Comandos:
#   start   - Inicia servicios (default: all)
#   stop    - Para servicios
#   restart - Reinicia servicios
#   status  - Muestra estado de servicios
#   logs    - Muestra logs (Ctrl+C para salir)
#
# Servicios:
#   all      - Frontend + Backend (default)
#   frontend - Solo frontend (puerto 3000)
#   backend  - Solo backend (puerto 8000)
#
# Ejemplos:
#   ./dev.sh start           # Inicia todo
#   ./dev.sh start backend   # Solo backend
#   ./dev.sh stop            # Para todo
#   ./dev.sh logs frontend   # Logs del frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID_FILE="$SCRIPT_DIR/.backend.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/.frontend.pid"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }

is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -d "/proc/$pid" ]; then
            return 0
        fi
    fi
    return 1
}

start_backend() {
    if is_running "$BACKEND_PID_FILE"; then
        log_warn "Backend ya está corriendo (PID: $(cat $BACKEND_PID_FILE))"
        return 0
    fi
    
    log_info "Iniciando backend..."
    cd "$SCRIPT_DIR/app/backend"
    
    if [ ! -d ".venv" ]; then
        log_info "Creando entorno virtual..."
        uv sync --python 3.12
    fi
    
    nohup uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "$SCRIPT_DIR/.backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    
    sleep 2
    if is_running "$BACKEND_PID_FILE"; then
        log_success "Backend iniciado en http://localhost:8000 (PID: $(cat $BACKEND_PID_FILE))"
    else
        log_error "Error al iniciar backend. Ver .backend.log"
        return 1
    fi
}

start_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        log_warn "Frontend ya está corriendo (PID: $(cat $FRONTEND_PID_FILE))"
        return 0
    fi
    
    log_info "Iniciando frontend..."
    cd "$SCRIPT_DIR/app/frontend"
    
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependencias..."
        bun install
    fi
    
    nohup bun run dev > "$SCRIPT_DIR/.frontend.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    
    sleep 3
    if is_running "$FRONTEND_PID_FILE"; then
        log_success "Frontend iniciado en http://localhost:3000 (PID: $(cat $FRONTEND_PID_FILE))"
    else
        log_error "Error al iniciar frontend. Ver .frontend.log"
        return 1
    fi
}

stop_service() {
    local name=$1
    local pid_file=$2
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        log_info "Parando $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        
        # Esperar a que termine
        for i in {1..10}; do
            if [ ! -d "/proc/$pid" ]; then
                break
            fi
            sleep 0.5
        done
        
        # Force kill si sigue vivo
        if [ -d "/proc/$pid" ]; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
        log_success "$name parado"
    else
        log_warn "$name no está corriendo"
        rm -f "$pid_file"
    fi
}

stop_backend() {
    stop_service "Backend" "$BACKEND_PID_FILE"
}

stop_frontend() {
    stop_service "Frontend" "$FRONTEND_PID_FILE"
}

show_status() {
    echo ""
    echo "Estado de servicios:"
    echo "-------------------"
    
    if is_running "$BACKEND_PID_FILE"; then
        echo -e "Backend:  ${GREEN}●${NC} Corriendo (PID: $(cat $BACKEND_PID_FILE)) - http://localhost:8000"
    else
        echo -e "Backend:  ${RED}○${NC} Parado"
    fi
    
    if is_running "$FRONTEND_PID_FILE"; then
        echo -e "Frontend: ${GREEN}●${NC} Corriendo (PID: $(cat $FRONTEND_PID_FILE)) - http://localhost:3000"
    else
        echo -e "Frontend: ${RED}○${NC} Parado"
    fi
    echo ""
}

show_logs() {
    local service=${1:-all}
    
    case $service in
        backend)
            if [ -f "$SCRIPT_DIR/.backend.log" ]; then
                tail -f "$SCRIPT_DIR/.backend.log"
            else
                log_error "No hay logs del backend"
            fi
            ;;
        frontend)
            if [ -f "$SCRIPT_DIR/.frontend.log" ]; then
                tail -f "$SCRIPT_DIR/.frontend.log"
            else
                log_error "No hay logs del frontend"
            fi
            ;;
        all|*)
            log_info "Mostrando logs combinados (Ctrl+C para salir)..."
            tail -f "$SCRIPT_DIR/.backend.log" "$SCRIPT_DIR/.frontend.log" 2>/dev/null || log_error "No hay logs disponibles"
            ;;
    esac
}

# Comando principal
CMD=${1:-start}
SERVICE=${2:-all}

case $CMD in
    start)
        case $SERVICE in
            all)
                start_backend
                start_frontend
                show_status
                ;;
            backend)
                start_backend
                ;;
            frontend)
                start_frontend
                ;;
            *)
                log_error "Servicio desconocido: $SERVICE"
                exit 1
                ;;
        esac
        ;;
    stop)
        case $SERVICE in
            all)
                stop_frontend
                stop_backend
                ;;
            backend)
                stop_backend
                ;;
            frontend)
                stop_frontend
                ;;
            *)
                log_error "Servicio desconocido: $SERVICE"
                exit 1
                ;;
        esac
        ;;
    restart)
        case $SERVICE in
            all)
                stop_frontend
                stop_backend
                sleep 1
                start_backend
                start_frontend
                show_status
                ;;
            backend)
                stop_backend
                sleep 1
                start_backend
                ;;
            frontend)
                stop_frontend
                sleep 1
                start_frontend
                ;;
            *)
                log_error "Servicio desconocido: $SERVICE"
                exit 1
                ;;
        esac
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$SERVICE"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs} [all|backend|frontend]"
        exit 1
        ;;
esac
