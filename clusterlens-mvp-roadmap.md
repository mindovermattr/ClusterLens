# ClusterLens — MVP & Roadmap

> WebGL-визуализатор распределённых систем

**Название проекта:** ClusterLens

**Короткое описание:** интерактивная WebGL-система для визуализации кластеров, сетевых задержек, отказов узлов, выборов лидера и других процессов в распределённых системах.

## 1. Идея проекта

**ClusterLens** — интерактивный WebGL-визуализатор распределённой системы.

Пользователь видит кластер узлов, которые обмениваются сообщениями по сети. Можно запускать сценарии: выбор лидера, сбой узла, задержка сети, потеря сообщений, восстановление узла, split-brain/network partition. Проект должен быть не просто красивой анимацией, а понятной симуляцией сетевых процессов.

Цель MVP — реализовать минимальную, но цельную систему: браузерный WebGL-клиент, backend-симулятор, WebSocket-стрим событий и визуализация одного алгоритма распределённой системы.

Рекомендуемый первый алгоритм: leader election через упрощённый Bully Algorithm или Raft-like election без полной репликации лога.

---

## 2. Почему проект уровня middle

Проект должен показать не только знание UI, но и системное мышление:

- real-time клиент-серверное взаимодействие;
- WebSocket-протокол событий;
- симуляция распределённой системы;
- визуализация состояния через WebGL;
- архитектура frontend/backend;
- управление состоянием на клиенте;
- обработка задержек, сбоев и сетевых условий;
- отладочная панель и воспроизводимые сценарии.

---

## 3. Технологический стек

### Frontend

Рекомендуемый стек:

- TypeScript;
- React;
- Vite;
- Three.js или React Three Fiber;
- Zustand или Redux Toolkit для состояния;
- WebSocket API;
- Tailwind CSS или обычный CSS Modules.

Если хочется меньше React-абстракций, можно использовать чистый Three.js + TypeScript.

### Backend

Рекомендуемый стек:

- Node.js;
- TypeScript;
- Fastify или Express;
- ws или Socket.IO;
- Zod для валидации сообщений;
- pino для логирования.

Альтернатива: Go backend с WebSocket, если хочется больше системности.

### Storage для MVP

Для MVP постоянная база данных не нужна. Состояние симуляции можно держать in-memory.

Для следующих версий можно добавить:

- SQLite/PostgreSQL для сохранения сценариев;
- Redis для pub/sub и масштабирования комнат;
- файл JSON для replay-сессий.

---

## 4. MVP: функциональность

### 4.1. Основной пользовательский сценарий

Пользователь открывает страницу и видит кластер из N узлов. По умолчанию N = 5.

Пользователь может:

1. Запустить симуляцию.
2. Остановить симуляцию.
3. Перезапустить симуляцию.
4. Убить выбранный узел.
5. Восстановить выбранный узел.
6. Добавить искусственную задержку сети.
7. Создать network partition между группами узлов.
8. Убрать partition.
9. Смотреть, какой узел сейчас лидер.
10. Видеть сообщения между узлами в виде анимаций.
11. Смотреть журнал событий.

### 4.2. Алгоритм MVP

Реализовать упрощённый алгоритм выбора лидера.

Вариант A: Bully Algorithm.

Плюсы:

- проще Raft;
- хорошо визуализируется;
- понятно, почему побеждает узел с большим ID;
- легко показать сбои и перевыборы.

Поведение:

- каждый узел имеет уникальный ID;
- узел с наибольшим ID среди живых узлов должен стать лидером;
- если лидер падает, остальные узлы обнаруживают это через heartbeat timeout;
- узел инициирует election;
- узлы обмениваются election/answer/coordinator сообщениями;
- новый лидер объявляет себя через coordinator message.

Вариант B: Raft-like election.

Плюсы:

- ближе к реальным распределённым системам;
- лучше выглядит на собеседовании;
- можно развивать дальше до репликации лога.

Минусы:

- сложнее корректно реализовать;
- больше edge cases.

Для MVP рекомендуется Bully Algorithm. После MVP можно перейти к Raft.

---

## 5. MVP: визуализация

### 5.1. Сцена

WebGL-сцена должна содержать:

- узлы кластера как сферы/кубы;
- подписи с ID узлов;
- цветовое или визуальное состояние узла;
- линии соединений между узлами;
- анимированные пакеты сообщений между узлами;
- выделение текущего лидера;
- визуальное обозначение упавших узлов;
- визуальное обозначение network partition.

### 5.2. Состояния узла

Минимальные состояния:

- follower;
- candidate/election active;
- leader;
- down;
- partitioned.

Даже если используется Bully Algorithm, состояние candidate всё равно полезно для визуализации процесса выборов.

### 5.3. Сообщения

Минимальные типы сообщений:

- heartbeat;
- election;
- answer;
- coordinator;
- timeout event, как внутреннее событие симуляции.

Сообщения должны отображаться как движущиеся точки/частицы от отправителя к получателю.

### 5.4. UI-панели

MVP должен иметь три панели:

1. Control Panel.
   - start;
   - pause;
   - reset;
   - kill node;
   - restore node;
   - create partition;
   - heal partition;
   - latency slider.

2. Cluster State Panel.
   - current leader;
   - list of nodes;
   - node status;
   - current term/epoch, если используется Raft-like модель;
   - last heartbeat time.

3. Event Log.
   - timestamp;
   - event type;
   - source node;
   - target node;
   - short message.

---

## 6. Backend-архитектура MVP

### 6.1. Основные модули

```txt
backend/
  src/
    index.ts
    server/
      httpServer.ts
      websocketServer.ts
    simulation/
      SimulationEngine.ts
      Cluster.ts
      Node.ts
      Network.ts
      Scheduler.ts
    algorithms/
      bully/
        BullyNodeBehavior.ts
        BullyMessages.ts
    protocol/
      clientMessages.ts
      serverEvents.ts
    utils/
      random.ts
      logger.ts
```

### 6.2. SimulationEngine

Отвечает за жизненный цикл симуляции:

- start;
- pause;
- reset;
- tick loop;
- применение команд пользователя;
- генерацию событий для клиента.

Симуляция должна работать дискретными тиками.

Рекомендуемые параметры MVP:

- tick interval: 100 ms;
- heartbeat interval: 1000 ms;
- heartbeat timeout: 3000 ms;
- default network latency: 200 ms;
- random jitter: 0–200 ms.

### 6.3. Cluster

Хранит список узлов и общее состояние:

- nodes;
- current leader;
- active partitions;
- simulation time;
- algorithm config.

### 6.4. Node

Хранит состояние одного узла:

- id;
- status;
- role;
- lastHeartbeatAt;
- knownLeaderId;
- electionInProgress;
- inbox/outbox или обработчики сообщений.

### 6.5. Network

Отвечает за доставку сообщений:

- задержка доставки;
- потеря сообщений;
- запрет доставки между partition-группами;
- очередь pending messages;
- генерация события `message_sent` и `message_delivered`.

Для MVP packet loss можно оставить равным 0, но предусмотреть поле в конфиге.

### 6.6. Scheduler

Управляет отложенными событиями:

- доставить сообщение через X ms;
- вызвать heartbeat;
- проверить timeout;
- выполнить scripted scenario step.

---

## 7. WebSocket-протокол

### 7.1. Client → Server

```ts
type ClientCommand =
  | { type: 'simulation:start' }
  | { type: 'simulation:pause' }
  | { type: 'simulation:reset'; nodeCount?: number }
  | { type: 'node:kill'; nodeId: string }
  | { type: 'node:restore'; nodeId: string }
  | { type: 'network:setLatency'; latencyMs: number }
  | { type: 'network:createPartition'; groups: string[][] }
  | { type: 'network:healPartition' };
```

### 7.2. Server → Client

```ts
type ServerEvent =
  | { type: 'snapshot'; state: ClusterSnapshot }
  | { type: 'node_updated'; node: NodeSnapshot }
  | { type: 'message_sent'; message: NetworkMessageSnapshot }
  | { type: 'message_delivered'; messageId: string }
  | { type: 'leader_changed'; leaderId: string | null }
  | { type: 'event_log'; entry: EventLogEntry }
  | { type: 'error'; message: string };
```

### 7.3. Snapshot

```ts
type ClusterSnapshot = {
  timeMs: number;
  running: boolean;
  leaderId: string | null;
  nodes: NodeSnapshot[];
  network: NetworkSnapshot;
};
```

---

## 8. Frontend-архитектура MVP

### 8.1. Основные модули

```txt
frontend/
  src/
    main.tsx
    app/
      App.tsx
      store.ts
    api/
      websocketClient.ts
      protocol.ts
    scene/
      ClusterScene.tsx
      NodeMesh.tsx
      EdgeMesh.tsx
      MessageParticle.tsx
      labels.tsx
    panels/
      ControlPanel.tsx
      ClusterStatePanel.tsx
      EventLogPanel.tsx
    domain/
      types.ts
      selectors.ts
```

### 8.2. State management

Хранить на клиенте:

- snapshot кластера;
- список активных анимаций сообщений;
- event log;
- connection status;
- UI state: selected node, selected scenario, camera mode.

### 8.3. Rendering

WebGL-сцена должна быть реактивной к состоянию:

- node role меняется → меняется вид узла;
- message_sent → создаётся particle animation;
- node down → узел визуально становится неактивным;
- partition → связь между группами визуально разрывается или подсвечивается.

---

## 9. Минимальный scope MVP

### Обязательно сделать

- Backend WebSocket server.
- In-memory simulation engine.
- 5 узлов в кластере.
- Упрощённый Bully Algorithm.
- Heartbeat от лидера.
- Timeout при падении лидера.
- Перевыборы лидера.
- Kill/restore node.
- Network partition/heal.
- WebGL-визуализация узлов и сообщений.
- Event log.
- Control panel.
- README с объяснением алгоритма и архитектуры.

### Не делать в MVP

- Авторизацию.
- Базу данных.
- Мультипользовательские комнаты.
- Реальную географическую карту.
- Kubernetes-интеграцию.
- Полный Raft log replication.
- Сложную физику сцены.
- Production-grade observability.

---

## 10. Definition of Done для MVP

MVP считается готовым, если:

1. Пользователь запускает приложение локально одной командой или двумя командами для frontend/backend.
2. В браузере отображается кластер из 5 узлов.
3. Один узел становится лидером.
4. Лидер отправляет heartbeat-сообщения.
5. Сообщения визуально летят между узлами.
6. При убийстве лидера начинается election.
7. После election появляется новый лидер.
8. При восстановлении узла он возвращается в кластер.
9. Network partition влияет на доставку сообщений.
10. Event log объясняет, что происходит.
11. Код разделён на понятные модули.
12. README объясняет запуск, архитектуру и ограничения.

---

## 11. Этапы разработки MVP

### Этап 1. Каркас проекта

Задачи:

- создать monorepo;
- настроить frontend на Vite + React + TypeScript;
- настроить backend на Node.js + TypeScript;
- добавить linting/formatting;
- добавить базовый README;
- поднять WebSocket-соединение;
- вывести connection status на frontend.

Результат:

- frontend подключается к backend через WebSocket;
- backend может отправить тестовый snapshot;
- frontend отображает тестовые данные.

### Этап 2. Simulation Engine

Задачи:

- реализовать SimulationEngine;
- реализовать Cluster;
- реализовать Node;
- реализовать tick loop;
- добавить команды start/pause/reset;
- отправлять snapshot клиенту раз в 100–250 ms.

Результат:

- backend симулирует время;
- frontend видит обновления состояния.

### Этап 3. WebGL-сцена

Задачи:

- создать сцену Three.js/R3F;
- расположить узлы по окружности;
- отрисовать связи между узлами;
- добавить labels;
- добавить выбор узла кликом;
- отображать роли и статусы узлов.

Результат:

- кластер визуально понятен;
- состояние узлов видно без чтения логов.

### Этап 4. Network layer

Задачи:

- реализовать Network;
- добавить очередь сообщений;
- добавить latency;
- добавить message_sent и message_delivered события;
- на frontend добавить анимацию пакетов.

Результат:

- сообщения не просто меняют состояние, а видны как движение между узлами.

### Этап 5. Leader election

Задачи:

- реализовать Bully Algorithm;
- добавить heartbeat;
- добавить heartbeat timeout;
- добавить election/answer/coordinator messages;
- добавить leader_changed event;
- протестировать падение лидера.

Результат:

- при падении лидера кластер выбирает нового лидера.

### Этап 6. Failure controls

Задачи:

- добавить kill node;
- добавить restore node;
- добавить create partition;
- добавить heal partition;
- добавить latency slider;
- добавить event log.

Результат:

- пользователь может интерактивно ломать систему и наблюдать последствия.

### Этап 7. Полировка MVP

Задачи:

- улучшить визуальное состояние узлов;
- добавить понятные подписи событий;
- добавить обработку disconnect/reconnect;
- добавить README с архитектурой;
- записать короткий demo GIF/video;
- добавить несколько unit-тестов для алгоритма election.

Результат:

- проект можно показать в портфолио.

---

## 12. Roadmap после MVP

### Версия 0.2 — Scenarios & Replay

Добавить воспроизводимые сценарии:

- leader fails after 5 seconds;
- network partition 2 vs 3;
- high latency mode;
- unstable network;
- node recovery during election.

Добавить replay:

- запись событий симуляции;
- воспроизведение событий по timeline;
- pause/step forward;
- export/import replay JSON.

Ценность:

- проект становится демонстрационным инструментом;
- проще показывать edge cases.

### Версия 0.3 — Raft election

Добавить второй алгоритм: Raft leader election.

Функции:

- terms;
- randomized election timeout;
- candidate/follower/leader roles;
- RequestVote;
- AppendEntries heartbeat;
- majority vote;
- split vote scenarios.

Ценность:

- проект становится ближе к настоящим распределённым системам;
- можно сравнивать Bully и Raft.

### Версия 0.4 — Raft log replication

Добавить минимальную репликацию лога.

Функции:

- client command;
- leader appends log entry;
- followers replicate entry;
- commit after majority;
- visual log per node;
- inconsistent logs during partition;
- healing and catch-up.

Ценность:

- проект становится серьёзным distributed systems visualizer.

### Версия 0.5 — Real-time collaborative mode

Добавить комнаты:

- несколько пользователей могут смотреть одну симуляцию;
- один пользователь управляет сценарием;
- остальные видят синхронное состояние;
- presence indicators;
- shared cursor or camera position.

Ценность:

- появляется дополнительный сетевой слой;
- проект показывает real-time collaboration.

### Версия 0.6 — Advanced network model

Добавить более реалистичную сеть:

- packet loss;
- jitter;
- bandwidth limit;
- message duplication;
- message reordering;
- asymmetric latency;
- directed partitions.

Ценность:

- можно демонстрировать, почему распределённые системы сложны.

### Версия 0.7 — Observability mode

Добавить режим диагностики:

- metrics panel;
- messages per second;
- election duration;
- time without leader;
- average latency;
- dropped messages;
- node health timeline.

Ценность:

- проект начинает напоминать observability-инструмент.

### Версия 0.8 — Persistence

Добавить хранение:

- сохранённые сценарии;
- сохранённые replay;
- пользовательские конфигурации кластеров;
- локальная SQLite/PostgreSQL база.

Ценность:

- проект становится полноценным приложением, а не только демкой.

### Версия 1.0 — Portfolio-ready release

Финальная версия для портфолио должна содержать:

- красивый landing page;
- интерактивную демо-сцену;
- README с диаграммой архитектуры;
- описание алгоритмов;
- live demo;
- docker-compose;
- тесты;
- CI;
- короткое видео;
- список известных ограничений.

---

## 13. Возможные усложнения для сильного портфолио

### Deterministic simulation

Сделать симуляцию детерминированной через seed.

Польза:

- replay становится точным;
- баги легче воспроизводить;
- можно писать тесты на сценарии.

### Timeline debugger

Добавить отладчик времени:

- pause;
- step tick;
- rewind;
- inspect node state at time T;
- inspect message queue.

### Algorithm comparison mode

Один и тот же сценарий запускать на разных алгоритмах:

- Bully;
- Raft election;
- Gossip leader election;
- simple heartbeat coordinator.

### Explain mode

Показывать пояснения рядом с событиями:

- почему начались выборы;
- почему узел стал кандидатом;
- почему голос принят или отклонён;
- почему лидер потерян.

### Chaos mode

Режим случайных сбоев:

- случайно падают узлы;
- меняется latency;
- появляются partitions;
- сеть восстанавливается.

---

## 14. Нефункциональные требования

### Производительность

MVP должен стабильно работать с 5–10 узлами.

После оптимизации желательно поддерживать:

- 50 узлов в простом режиме;
- 200+ сообщений в секунду в визуализации;
- отключаемую анимацию сообщений для больших кластеров.

### Надёжность

- WebSocket reconnect на клиенте;
- валидация команд на backend;
- защита от некорректных nodeId;
- graceful reset симуляции.

### Поддерживаемость

- типизированный протокол сообщений;
- отдельный слой алгоритмов;
- отдельный слой сети;
- frontend не должен сам решать алгоритмическую логику;
- backend является source of truth.

---

## 15. Тестирование

### Unit-тесты

Минимум:

- election starts when leader dies;
- highest alive node becomes leader in Bully Algorithm;
- down node does not receive/process messages;
- partition blocks messages between groups;
- heal partition restores delivery.

### Integration-тесты

- start simulation → leader appears;
- kill leader → new leader appears;
- create partition → messages between groups are blocked;
- restore node → node rejoins cluster.

### Manual QA сценарии

1. Запустить симуляцию.
2. Дождаться лидера.
3. Убить лидера.
4. Убедиться, что начались выборы.
5. Убедиться, что выбран новый лидер.
6. Создать partition.
7. Проверить, что сообщения между группами не доставляются.
8. Убрать partition.
9. Проверить, что кластер приходит в стабильное состояние.

---

## 16. README структура

В корне проекта README должен содержать:

```md
# WebGL Distributed System Visualizer

## What is this?

## Demo

## Features

## Architecture

## How the simulation works

## Implemented algorithms

## WebSocket protocol

## Running locally

## Development

## Testing

## Roadmap

## Known limitations
```

---

## 17. Рекомендуемая первая реализация

Для первой версии не усложнять проект Raft-ом. Сделать Bully Algorithm, но архитектуру сразу спроектировать так, чтобы алгоритм можно было заменить.

Ключевая идея архитектуры:

```ts
interface NodeBehavior {
  onTick(ctx: NodeContext): void;
  onMessage(message: NetworkMessage, ctx: NodeContext): void;
  onStart(ctx: NodeContext): void;
  onStop(ctx: NodeContext): void;
}
```

Тогда Bully, Raft и другие алгоритмы будут разными реализациями одного интерфейса.

---

## 18. Приоритеты для агента

При разработке придерживаться приоритетов:

1. Сначала рабочая симуляция без красоты.
2. Потом WebSocket-события.
3. Потом WebGL-визуализация.
4. Потом интерактивное управление.
5. Потом полировка и документация.

Не начинать с детальной графики. Главная ценность проекта — корректная модель, понятная архитектура и визуализация причинно-следственных связей.

---

## 19. Итоговый MVP backlog

### Backend

- [ ] Create TypeScript backend project.
- [ ] Add WebSocket server.
- [ ] Define protocol types.
- [ ] Add simulation engine.
- [ ] Add cluster model.
- [ ] Add node model.
- [ ] Add network delivery queue.
- [ ] Add latency config.
- [ ] Add partition config.
- [ ] Implement Bully Algorithm.
- [ ] Emit snapshots.
- [ ] Emit message events.
- [ ] Emit event log entries.
- [ ] Handle client commands.
- [ ] Add basic tests.

### Frontend

- [ ] Create Vite React TypeScript app.
- [ ] Add WebSocket client.
- [ ] Add global state store.
- [ ] Render cluster in WebGL.
- [ ] Render node labels.
- [ ] Render links between nodes.
- [ ] Render animated message particles.
- [ ] Add control panel.
- [ ] Add node state panel.
- [ ] Add event log panel.
- [ ] Add selected node state.
- [ ] Add reconnect handling.
- [ ] Polish layout.

### Documentation

- [ ] Add project overview.
- [ ] Add local run instructions.
- [ ] Add architecture diagram.
- [ ] Explain Bully Algorithm.
- [ ] Explain WebSocket protocol.
- [ ] Add roadmap.
- [ ] Add limitations.

---

## 20. Названия проекта

Возможные названия:

- ClusterScope
- RaftScope
- NetFault Lab
- Consensus Playground
- Distributed Systems Lab
- ClusterLens
- FaultLab
- QuorumView

Для MVP лучше нейтральное название: `ClusterScope` или `Consensus Playground`.
