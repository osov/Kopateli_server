# Документация по сетевому протоколу

Этот документ описывает протокол обмена данными между клиентом и сервером игры "Копатели".

## Общая структура сообщения

Все сообщения передаются в формате JSON и имеют следующую базовую структуру:

```json
{
  "id": <NetIdMessages>,
  "msg": <Object>
}
```

- `id`: Идентификатор сообщения из `NetIdMessages`.
- `msg`: Объект с данными, специфичными для каждого сообщения.

## Сообщения

### `CS_CONNECT`
- **Направление:** Клиент → Сервер
- **Описание:** Первое сообщение от клиента для установки соединения и аутентификации.
- **Структура `msg`:**
  ```typescript
  interface CS_CONNECT {
      id_session: string; // Идентификатор сессии
      hash: string;       // Хэш для проверки подлинности
      version: number;    // Версия клиента
  }
  ```

### `SC_INIT`
- **Направление:** Сервер → Клиент
- **Описание:** Отправляется после успешной аутентификации. Содержит начальные данные для клиента.
- **Структура `msg`:**
  ```typescript
  interface SC_INIT {
      id_user: number;      // Уникальный ID пользователя
      server_time: number;  // Текущее время сервера
      data: {
          id: string;     // ID текущей локации
          layer: number;  // Слой локации
      };
  }
  ```

### `CS_PING` / `SC_PONG`
- **Направление:** Клиент ↔ Сервер
- **Описание:** Используется для измерения задержки (пинга) и поддержания соединения.
- **Структура `CS_PING`:**
  ```typescript
  interface CS_PING {
      client_time: number; // Время отправки на клиенте
  }
  ```
- **Структура `SC_PONG`:**
  ```typescript
  interface SC_PONG {
      client_time: number; // Время с `CS_PING`
      server_time: number; // Время ответа на сервере
  }
  ```

### `CS_INPUT_STICK`
- **Направление:** Клиент → Сервер
- **Описание:** Отправляет состояние пользовательского ввода (например, джойстика).
- **Структура `msg`:**
  ```typescript
  interface CS_INPUT_STICK {
      angle: number; // Угол движения
      state: number; // Состояние (например, нажат/отпущен)
  }
  ```

### `SC_WORLD_STATE`
- **Направление:** Сервер → Клиент
- **Описание:** Отправляется клиенту после входа в комнату. Содержит полное состояние всех сущностей в этой комнате.
- **Структура `msg`:**
  ```typescript
  interface SC_WORLD_STATE {
      list: EntityFullState[]; // Массив состояний сущностей
  }
  ```

### `SC_STATE_CHANGE`
- **Направление:** Сервер → Клиент
- **Описание:** Сообщает об изменении состояния одной сущности (позиция, угол, статус).
- **Структура `msg`:**
  ```typescript
  type SC_STATE_CHANGE = EntityState & {
      time: number;
  };
  ```

### `SC_ADD_ENTITY` / `SC_REMOVE_ENTITY`
- **Направление:** Сервер → Клиент
- **Описание:** Сообщает о добавлении или удалении сущности из мира.
- **Структура `SC_ADD_ENTITY`:**
  ```typescript
  type SC_ADD_ENTITY = EntityFullState & {
      time: number;
  };
  ```
- **Структура `SC_REMOVE_ENTITY`:**
  ```typescript
  interface SC_REMOVE_ENTITY {
      id: number; // ID удаляемой сущности
  }
  ```

### `SC_JOIN` / `SC_LEAVE`
- **Направление:** Сервер → Клиент
- **Описание:** Уведомляет всех клиентов в комнате о том, что игрок присоединился или покинул ее.
- **Структура `msg`:**
  ```typescript
  interface SC_JOIN {
      id_user: number;   // ID пользователя
      id_entity: number; // ID его сущности в мире
  }
  interface SC_LEAVE {
      id_user: number;
      id_entity: number;
  }
  ```

### `CS_REQUEST_INTERACT`
- **Направление:** Клиент → Сервер
- **Описание:** Запрос на взаимодействие с объектом в мире (например, переход в другую локацию) или подтверждение загрузки.
- **Структура `msg`:**
  ```typescript
  interface CS_REQUEST_INTERACT {
      id: string; // ID объекта взаимодействия
      type: RequestType; // Тип запроса (REQUEST или CONFIRM)
  }
  ```

### `SC_RESPONSE_INTERACT`
- **Направление:** Сервер → Клиент
- **Описание:** Ответ на `CS_REQUEST_INTERACT`. Сообщает об успехе и передает данные для новой локации.
- **Структура `msg`:**
  ```typescript
  interface SC_RESPONSE_INTERACT {
      status: number; // 1 - успех, 0 - неудача
      result?: {
          id: string;   // ID новой локации
          layer: number;
      };
  }
  ```

### `SC_CLOSE`
- **Направление:** Сервер → Клиент
- **Описание:** Сообщение о принудительном закрытии соединения со стороны сервера.
- **Структура `msg`:**
  ```typescript
  interface SC_CLOSE {
      reason?: string; // Причина закрытия
  }
  ```
