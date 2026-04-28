# 星露谷风格农场游戏 MVP 实施计划

## Context

用户想在 `/Users/zhangjinhui/Desktop/agent-sprite-forge-demo` 中开发一个“星露谷物语风格”的 MVP，并明确要求使用项目内的 `generate2dsprite` 和 `generate2dmap` 两个 skill 生成美术资产和地图。

当前项目状态很轻：`README.md` 只有两个 skill 使用示例；根目录没有 `package.json`、`src`、游戏运行时代码；`assets/map`、`assets/sprites`、`data` 基本为空。因此推荐先做一个原创的浏览器版小农场 MVP，不复刻原作素材、角色、地图或 UI，只保留“俯视像素农场、种植、NPC 商店、保存进度”的核心体验。

预期结果：玩家打开浏览器即可游玩；能移动、碰撞、交互、种植、浇水、睡觉推进天数、收获、买卖种子/作物，并能刷新页面后继续。

## 执行顺序要求

实施开始后，第一步先把本计划保存到当前项目目录：

- `/Users/zhangjinhui/Desktop/agent-sprite-forge-demo/MVP_PLAN.md`

保存计划后，再开始生成资产、生成地图和编写游戏代码。

## 推荐技术方案

使用：

- Phaser 3：负责 2D 精灵、动画、输入、摄像机、渲染顺序、碰撞。
- TypeScript：让地图数据、存档数据、物品数据结构清晰。
- Vite：快速启动浏览器开发环境。
- `localStorage`：保存 MVP 的金币、背包、天数、作物状态、玩家位置。
- `layered_raster + y_sorted_props + precise_shapes + trigger_zones`：作为地图管线。

不要第一阶段就做完整 tilemap 编辑器、小镇大地图、季节系统、任务系统、战斗系统、复杂 UI。MVP 第一版只做一张农场地图、一个 NPC、一种作物、一套最小经济循环。

## MVP 功能范围

第一版必须完成：

1. 玩家出现在农场地图。
2. WASD/方向键移动。
3. 玩家播放四方向行走动画。
4. 房屋、水塘、树、栅栏、地图边界阻挡玩家。
5. 玩家进入交互区时显示提示。
6. 玩家可在固定农田格子播种一种作物。
7. 玩家可浇水。
8. 睡觉/下一天后，已浇水作物成长。
9. 成熟作物可收获。
10. 一个 NPC 小摊可以买种子、卖作物。
11. 金币、背包、天数、作物状态可保存。
12. 刷新页面后状态恢复。

第一版不做：

- 不做原作地图/角色/名称复刻。
- 不做多人联机。
- 不做复杂季节、天气、钓鱼、采矿、任务线。
- 不做第二张小镇地图，商店先放在农场里的 NPC 小摊。

## Agent Team 分工

本任务适合轻量 agent team，不需要大型企业级调度。

### 1. Team Lead / Main Controller

职责：

- 控制 MVP 范围。
- 冻结尺寸、数据结构、目录结构。
- 调用和协调 `generate2dsprite`、`generate2dmap`。
- 审查各阶段交付物是否能接入运行时。

### 2. Art Pipeline Agent

建议 agent：`general-purpose`，专门负责资产生成流程。

职责：

- 使用 `/generate2dsprite` 生成玩家、NPC、作物、物品图标。
- 检查透明背景、网格、帧尺寸、方向顺序、`pipeline-meta.json`。
- 不合格时重生成或重新后处理。

交付路径：

- `assets/sprites/player_farmer/sheet-transparent.png`
- `assets/sprites/npc_seed_seller/sheet-transparent.png`
- `assets/sprites/crop_turnip/sheet-transparent.png`
- `assets/sprites/items_farming/sheet-transparent.png`

### 3. Map Pipeline Agent

建议 agent：`general-purpose`，专门负责地图生成流程。

职责：

- 使用 `/generate2dmap` 生成农场主地图。
- 输出 layered raster 图层、props、placement JSON、collision JSON、zones JSON、preview。
- 确保碰撞和交互区是结构化 JSON，不从图片自动推断。

交付路径：

- `assets/map/farm/farm-base.png`
- `assets/map/farm/farm-layered-preview.png`
- `data/farm-props.json`
- `data/farm-collision.json`
- `data/farm-zones.json`

### 4. Runtime Agent

建议 agent：`frontend-developer`。

职责：

- 建立 Vite + Phaser + TypeScript 项目。
- 实现玩家、地图加载、碰撞、交互、农耕、商店、保存。
- 接入 Art Pipeline 和 Map Pipeline 的产物。

关键代码路径：

- `package.json`
- `index.html`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.ts`
- `src/scenes/PreloadScene.ts`
- `src/scenes/FarmScene.ts`
- `src/scenes/UIScene.ts`
- `src/objects/Player.ts`
- `src/objects/Npc.ts`
- `src/objects/CropPlot.ts`
- `src/systems/CollisionSystem.ts`
- `src/systems/InteractionSystem.ts`
- `src/systems/FarmingSystem.ts`
- `src/systems/InventorySystem.ts`
- `src/systems/ShopSystem.ts`
- `src/systems/SaveSystem.ts`

### 5. QA Agent

建议 agent：`qa-engineer`。

职责：

- 资产 QC。
- 地图碰撞和 zones QC。
- 浏览器内完整玩法冒烟测试。
- 检查刷新保存恢复。
- 检查生产构建。

## 资产生成计划

### 玩家角色

使用 `/generate2dsprite`：

- 目标：原创农夫主角。
- 风格：温暖乡村像素风，俯视 3/4 RPG overworld。
- sheet：4x4。
- 帧尺寸：32x48。
- sheet 尺寸：128x192。
- 行顺序：down、left、right、up。
- 列顺序：neutral、left foot、neutral、right foot。
- 背景：纯 `#FF00FF`。
- 输出目录：`assets/sprites/player_farmer`。

后处理复用：

- `.claude/skills/generate2dsprite/scripts/generate2dsprite.py`
- 使用 `process --target player --mode player_sheet --shared-scale --align feet --reject-edge-touch`。

### NPC

使用 `/generate2dsprite`：

- 目标：原创种子商人 NPC。
- sheet：4x4，方便后续扩展；MVP 可只使用朝下静止帧。
- 帧尺寸：32x48。
- 输出目录：`assets/sprites/npc_seed_seller`。

### 作物

使用 `/generate2dsprite`：

- 目标：原创芜菁/萝卜类作物。
- sheet：1x4。
- 帧尺寸：32x32。
- 阶段：seedling、sprout、grown、harvestable。
- 输出目录：`assets/sprites/crop_turnip`。

### 工具和物品图标

使用 `/generate2dsprite`：

- sheet：1x4。
- 帧尺寸：32x32。
- 顺序：hoe、watering_can、turnip_seed、turnip_crop。
- 输出目录：`assets/sprites/items_farming`。

### 资产 QC 标准

检查：

- `sheet-transparent.png` 存在。
- 透明图中没有残留 `#FF00FF` 背景。
- 没有文字、UI、边框、标签。
- 角色所有帧同身份、同尺度、同光照。
- 角色没有触碰 cell 边缘。
- `pipeline-meta.json` 与目标 rows/cols/mode 匹配。

参考文件：

- `.claude/skills/generate2dsprite/SKILL.md`
- `.claude/skills/generate2dsprite/references/prompt-rules.md`

## 地图生成计划

使用 `/generate2dmap` 生成第一张也是唯一一张 MVP 主地图：农场。

推荐参数：

- visual model：`layered_raster`
- runtime object model：`y_sorted_props + interactive_entities`
- collision model：`precise_shapes + trigger_zones`
- engine target：`Phaser / project-native JSON`
- 画布：1280x960。
- 网格：32px。
- 逻辑尺寸：40x30 tiles。

地图内容：

- 玩家出生点。
- 农舍。
- 固定农田 4x3 或 5x4。
- NPC 种子小摊。
- 水塘。
- 树木。
- 栅栏。
- 土路。
- 邮箱/公告牌。
- 睡觉/下一天入口。

地图产物：

- `assets/map/farm/farm-base.png`：地面、草地、道路、水面、农田底图。
- `assets/map/farm/farm-layered-preview.png`：QA 预览图。
- `assets/props/...`：树、房屋、栅栏、小摊等透明 props。
- `data/farm-props.json`：props 摆放坐标和 `sortY`。
- `data/farm-collision.json`：阻挡矩形/椭圆。
- `data/farm-zones.json`：交互区、农田区、睡觉区、商店区。

复用工具：

- `.claude/skills/generate2dmap/scripts/extract_prop_pack.py`：从纯 `#FF00FF` prop sheet 提取透明 props。
- `.claude/skills/generate2dmap/scripts/compose_layered_preview.py`：根据 base map 和 placement JSON 合成预览。
- `.claude/skills/codex-gateway-imagegen/scripts/generate_gateway_image.py`：由 skill 内部通过 gateway 生成原始图片。

地图规则：

- base map 只放地面层，不烘焙房屋、树、NPC、文字、UI。
- tall props 单独生成透明图片。
- 碰撞区域手工写 JSON，不用透明 PNG 边界自动当碰撞。
- 阻挡物只挡“底座”，不要用整棵树冠阻挡。
- 玩家出生点必须不在碰撞体中。
- 农田格子必须和视觉农田对齐。

参考文件：

- `.claude/skills/generate2dmap/SKILL.md`
- `.claude/skills/generate2dmap/references/map-strategies.md`
- `.claude/skills/generate2dmap/references/layered-map-contract.md`

## 数据结构计划

### `data/farm-collision.json`

建议结构：

```json
{
  "mapSize": { "width": 1280, "height": 960 },
  "spawn": { "x": 640, "y": 720 },
  "blockers": [
    { "id": "farmhouse", "type": "rect", "x": 120, "y": 120, "w": 220, "h": 150 },
    { "id": "pond", "type": "ellipse", "x": 950, "y": 640, "rx": 120, "ry": 80 }
  ]
}
```

### `data/farm-zones.json`

建议结构：

```json
{
  "zones": [
    { "id": "npc_shop", "kind": "shop", "type": "rect", "x": 760, "y": 430, "w": 120, "h": 90 },
    { "id": "sleep", "kind": "next_day", "type": "rect", "x": 190, "y": 300, "w": 80, "h": 60 }
  ],
  "fieldPlots": [
    { "id": "plot_01", "x": 420, "y": 520, "w": 32, "h": 32 }
  ]
}
```

### 存档结构

保存在 `localStorage`：

```ts
type GameSave = {
  version: 1;
  day: number;
  gold: number;
  inventory: {
    turnipSeed: number;
    turnipCrop: number;
  };
  player: { x: number; y: number; facing: 'down' | 'left' | 'right' | 'up' };
  plots: Record<string, {
    cropId: 'turnip' | null;
    stage: number;
    wateredToday: boolean;
  }>;
};
```

## 运行时代码实施步骤

### Phase 1：初始化项目

创建：

- `package.json`
- `index.html`
- `tsconfig.json`
- `vite.config.ts`
- `src/main.ts`

安装依赖：

- `phaser`
- `typescript`
- `vite`

脚本：

- `npm run dev`
- `npm run build`
- `npm run preview`

### Phase 2：基础场景

创建：

- `src/scenes/PreloadScene.ts`
- `src/scenes/FarmScene.ts`
- `src/scenes/UIScene.ts`

功能：

- 加载玩家、NPC、作物、物品 sheet。
- 加载地图 PNG 和 JSON。
- 显示 farm base map。
- 设置 pixelArt/nearest 渲染。

### Phase 3：玩家移动和碰撞

创建：

- `src/objects/Player.ts`
- `src/systems/CollisionSystem.ts`

功能：

- WASD/方向键移动。
- 四方向 walk 动画。
- 停止时保持最后朝向。
- 玩家碰撞体只使用脚底区域。
- 从 `data/farm-collision.json` 创建阻挡体。
- 摄像机跟随并限制在地图边界内。

### Phase 4：交互和 UI

创建：

- `src/systems/InteractionSystem.ts`
- `src/objects/Npc.ts`

功能：

- 从 `data/farm-zones.json` 读取 zones。
- 玩家进入 zone 后显示提示。
- E 键触发 NPC 商店或睡觉下一天。
- UI 显示天数、金币、种子数、作物数、当前工具。

### Phase 5：农耕系统

创建：

- `src/objects/CropPlot.ts`
- `src/systems/FarmingSystem.ts`
- `src/systems/InventorySystem.ts`

规则：

- 初始金币 20。
- 初始种子 5。
- 种子价格 5。
- 作物售价 8。
- 作物需要 3 次“浇水后睡觉”成熟。
- 未浇水则睡觉后不成长。
- 成熟后可收获并清空地块。

操作：

- `1` 选择种子。
- `2` 选择水壶。
- `3` 选择收获/手。
- `E` 交互。

### Phase 6：商店和保存

创建：

- `src/systems/ShopSystem.ts`
- `src/systems/SaveSystem.ts`

功能：

- 买 1 个种子：金币减少，种子增加。
- 卖 1 个作物：作物减少，金币增加。
- 金币不足或物品不足时不改变状态。
- 播种、浇水、睡觉、收获、买卖后保存。
- 页面刷新后恢复。
- 提供重置存档入口，方便测试。

## 验证计划

### 资产验证

- 检查所有 `sheet-transparent.png` 是否存在。
- 检查透明背景是否干净。
- 检查玩家/NPC sheet 是否为 4x4。
- 检查作物/物品 sheet 是否为 1x4。
- 检查 `pipeline-meta.json` 是否可读。
- 检查没有文字、UI、标签、水印。

### 地图验证

- 检查 base map 尺寸为 1280x960。
- 检查 preview 能正确合成。
- 检查 `data/farm-props.json` 可解析，引用的 prop 图片都存在。
- 检查 `data/farm-collision.json` 可解析。
- 检查 `data/farm-zones.json` 可解析。
- 检查 spawn 不在 blocker 内。
- 检查 farm plots 与视觉农田对齐。
- 检查 NPC shop zone、sleep zone 可到达。

### 代码验证

运行：

- `npm run build`
- `npm run dev`

浏览器测试：

1. 打开 dev server。
2. 地图显示。
3. 玩家显示。
4. 玩家可移动。
5. 玩家动画方向正确。
6. 玩家不能穿过房子、水塘、树、栅栏、边界。
7. 靠近 NPC 出现提示。
8. 按 E 打开商店。
9. 购买种子。
10. 到农田播种。
11. 浇水。
12. 进入睡觉区，下一天。
13. 重复直到成熟。
14. 收获。
15. 出售作物。
16. 刷新页面，确认金币、背包、作物、天数恢复。
17. `npm run build` 后 `npm run preview` 再跑一遍核心流程。

### 完成标准

MVP 视为完成，当且仅当：

- 浏览器能运行。
- 玩家能移动和碰撞。
- 地图、角色、NPC、作物、物品图标均来自项目生成流程或原创实现。
- 一种作物完整完成“买种子 -> 播种 -> 浇水 -> 睡觉成长 -> 收获 -> 出售”。
- 状态可以保存和恢复。
- 控制台没有阻塞性错误。
- 生产构建通过。
