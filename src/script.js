        // ==========================================
        // 設定・グローバル変数
        // ==========================================
        let scene, camera, renderer;
        let player, playerTexture, textureLoader;
        let clock, delta;
        let isPlaying = false;
        let isPaused = false; 
        let score = 0;
        let speed = 15;
        let distance = 0; // 走行距離
        let highScore = 0; 
        let highDistance = 0; 

        // ▼▼▼ 追加 (覚醒スタート用) ▼▼▼
        let isAwakeningUnlocked = false; 
        const AWAKENING_UNLOCK_COST = 200;
        const AWAKENING_START_DISTANCE = 5000;
        const AWAKENING_START_SPEED = 47; // 5000m到達時の想定スピード (計算値)
        const AWAKENING_START_SCORE = 5000; // 距離と合わせる
        // ▲▲▲ 追加 ▲▲▲

        // --- データ管理 ---
        let mutekiBalls = 0;
        let currentSkin = 'player.png';
        let ownedSkins = new Set(['player.png']); // デフォルトスキン
        const NORMAL_GACHA_COST = 10; // ▼ 変更: トロツキーワクワクガチャのコスト
        const RARE_GACHA_COST = 20; // ▼ 追加: 資本主義の奴隷ガチャのコスト
        let currentGachaType = 'normal'; // ▼ 追加: 現在開いているガチャの種類 ('normal' or 'rare')

        const SKIN_LIST = [
            'player.png', 'player2.jpg', 'player3.jpg', 'player4.jpg', 'player5.jpg', 'player6.jpg', 'player7.jpg', 'player8.jpg', 'player9.jpg', 'player10.jpg', 'player11.jpg', 'player12.jpg', 'player13.jpg', 'player14.jpg', 'player15.jpg', 'player16.jpg', 'player17.jpg', 'player18.png'
        ];
        const SAVE_DATA_KEY = 'revolutionRunData';

        // ▼▼▼ 追加/変更 (カスタムスキン用) ▼▼▼
        const CUSTOM_SKIN_ID = 'custom_skin.png'; // カスタムスキンの内部ID
        const CUSTOM_SKIN_KEY = 'revolutionRunCustomSkin'; // localStorageキー (DataURL)
        const CUSTOM_SKIN_TYPE_KEY = 'revolutionRunCustomSkinType'; // ( 'static' or 'gif' )
        let customSkinDataURL = null; // カスタムスキンのData URLを保持
        let isCustomSkinAnimated = false; // カスタムスキンがGIFかどうか
        let customSkinGifElement; // GIFアニメーション用の <img> 要素
        // ▲▲▲ 追加/変更 ▲▲▲

        // レーン設定
        let currentLane = 0; 
        const LANE_WIDTH = 3.0; 
        let targetX = 0;

        // アクション状態
        let isJumping = false;
        let isCrouching = false;
        let jumpVelocity = 0;
        let gravity = -35;
        let crouchTimer = 0;
        let isOnPlatform = false;
        let currentPlatformTopY = 0.75;
        let currentPlatform = null;
        let currentPlatformHalfDepth = 0;
        let isDroppingFromPlatform = false;
        let platformDropVelocity = 0;
        let platformDropTargetY = 0.75;

        // オブジェクト管理
        let obstacles = [];
        let lastObstacleTypes = []; // 障害物生成の履歴
        
        // 画像パス (ガチャのターゲット画像)
        const TOROTUKI_IMG_SRC = 'torotuki.jpg';
        const BERLIN_WALL_IMG_SRC = 'BerlinWall.jpg'; // ▼ 追加: レアガチャ用ターゲット画像

        // BGM用
        const DEFAULT_BGM_SRC = 'bgm.mp3'; // ★デフォルトBGMのパス
        let bgmElement;
        let isBGMEnabled = false; 
        const BGM_SAVE_KEY = 'revolutionRunBGM';

        // ガチャ用レアスキン
        const RARE_SKINS = [
            { name: 'fuziwara.jpg', rate: 0.005, rarity: "超絶革命" }, // 0.5%
            { name: 'kora_torotuki.png', rate: 0.005, rarity: "超絶革命" }, // 0.5%
            { name: 'sonbun.jpg', rate: 0.01, rarity: "超革命的" }, // 1%
            { name: 'poru.jpg', rate: 0.01, rarity: "超革命的" }, // 1%
            { name: 'ejof.png', rate: 0.01, rarity: "超革命的" }, 
            { name: 'matoryo.png', rate: 0.1, rarity: "超革命的" }, // 10%
            { name: TOROTUKI_IMG_SRC, rate: 0.01, rarity: "革命的" } // 1% (元の1%)
        ];

        const SCHLIEFFEN_SKINS = [
            { name: 'tyobihige.png', rarity: "通常" },
            { name: 'gepperusu.png', rarity: "通常" },
            { name: 'geringu.png', rarity: "通常" },
            { name: 'himura.png', rarity: "通常" },
            { name: 'hesu.png', rarity: "レア" },
            { name: 'tibihitora.png', rarity: "レア" }
        ];

        // ==========================================
        // 初期化・セットアップ
        // ==========================================
        function init() {
            textureLoader = new THREE.TextureLoader(); 
            
            // シーン
            scene = new THREE.Scene();
            
            // ★変更: 背景画像の読み込み (kremlin.PNG)
            // フォグとブレンドさせず、背景に固定表示させる
            textureLoader.load('kremlin.PNG', function(texture) {
                scene.background = texture;
            }, undefined, function(err) {
                // 読み込み失敗時のフォールバック
                console.log("背景画像読み込み失敗、単色にします");
                scene.background = new THREE.Color(0x110022);
            });

            scene.fog = new THREE.FogExp2(0x110022, 0.02);

            // カメラ
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 9, 12);
            camera.lookAt(0, 0, -5);

            // レンダラー
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            document.body.appendChild(renderer.domElement);

            // ライト
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            scene.add(dirLight);

            // 床
            const gridHelper = new THREE.GridHelper(200, 100, 0xff0055, 0x222222);
            gridHelper.position.y = 0;
            scene.add(gridHelper);

            // プレイヤー生成
            createPlayer();

            // ▼▼▼ 追加/変更 ▼▼▼
            setupCustomSkinUploader();
            setupBGMUploader(); // ★BGMアップロード設定
            customSkinGifElement = document.getElementById('custom-skin-gif-source');
            // ▲▲▲ 追加/変更 ▲▲▲

            // イベントリスナー
            window.addEventListener('resize', onWindowResize);
            setupInputs(); 

            // BGMセットアップ
            bgmElement = document.getElementById('bgm-player');
            loadBGMSetting(); 
            updateBGMButtonUI();
            bgmElement.muted = true; 

            // ★ロード処理
            loadData(); // この中でスキンセレクターUIとハイスコアUIと覚醒UIが更新される

            // ループ開始
            clock = new THREE.Clock();
            animate();
        }

        // プレイヤー作成
        function createPlayer() {
            const geometry = new THREE.PlaneGeometry(1.5, 1.5);
            const material = new THREE.MeshBasicMaterial({ 
                map: null, 
                transparent: true, 
                side: THREE.DoubleSide 
            });
            player = new THREE.Mesh(geometry, material);
            player.position.y = 0.75;
            scene.add(player);
            applySkin(currentSkin);
        }

        // ▼▼▼ 変更 (GIF対応のため applySkin を大幅に変更) ▼▼▼
        // スキンを適用する関数
        function applySkin(skinName) {
            
            const onTextureError = (err) => {
                console.error('スキン画像の読み込み失敗:', skinName, err);
                if (player) {
                    player.material.map = createPlaceholderTexture('#ffffff');
                    player.material.needsUpdate = true;
                }
            };

            if (skinName === CUSTOM_SKIN_ID) {
                // --- カスタムスキンの場合 ---
                if (isCustomSkinAnimated && customSkinDataURL) {
                    // 1. アニメーションGIF の場合
                    try {
                        // <img> 要素のsrcをセット
                        if (customSkinGifElement.src !== customSkinDataURL) {
                            customSkinGifElement.src = customSkinDataURL;
                        }
                        
                        // <img> 要素から新しいTextureを作成
                        const gifTexture = new THREE.Texture(customSkinGifElement);
                        gifTexture.needsUpdate = true; // 最初のフレームをアップロード
                        
                        if (player) {
                            player.material.map = gifTexture;
                            player.material.needsUpdate = true;
                        }
                        currentSkin = skinName;

                    } catch (e) {
                        onTextureError(e);
                    }
                } else if (customSkinDataURL) {
                    // 2. 静止画 (PNG/JPG) の場合
                    textureLoader.load(customSkinDataURL, 
                        (tex) => {
                            if (player) {
                                player.material.map = tex;
                                player.material.needsUpdate = true;
                            }
                            currentSkin = skinName; 
                        },
                        undefined, 
                        onTextureError
                    );
                } else {
                    // 3. データが失われている場合
                    console.warn("カスタムスキンが選択されていますが、データが見つかりません。デフォルトに戻します。");
                    applySkin('player.png'); // デフォルトスキンを適用
                    currentSkin = 'player.png'; // currentSkinもリセット
                    return;
                }
            } else {
                // --- 通常のスキンの場合 ---
                textureLoader.load(skinName, 
                    (tex) => {
                        if (player) {
                            player.material.map = tex;
                            player.material.needsUpdate = true;
                        }
                        currentSkin = skinName; 
                    },
                    undefined, 
                    onTextureError
                );
            }
        }
        // ▲▲▲ 変更 ▲▲▲

        // 画像がない場合の代替テクスチャ生成
        function createPlaceholderTexture(color) {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillRect(40, 45, 15, 25); ctx.fillRect(73, 45, 15, 25);
            ctx.beginPath(); ctx.arc(64, 85, 20, 0, Math.PI, false); ctx.stroke();
            return new THREE.CanvasTexture(canvas);
        }

        function createPlatformMaterial(color) {
            return new THREE.MeshStandardMaterial({
                color,
                roughness: 0.95,
                metalness: 0.02,
                transparent: false,
                opacity: 1,
                depthWrite: true,
                depthTest: true,
                fog: false,
                side: THREE.DoubleSide,
                alphaTest: 0
            });
        }

        function createStripedTexture(baseColor, stripeColor, stripeWidth = 14) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 128, 128);

            ctx.fillStyle = stripeColor;
            for (let x = -128; x < 256; x += stripeWidth * 2) {
                ctx.save();
                ctx.translate(x, 0);
                ctx.rotate(-Math.PI / 4);
                ctx.fillRect(0, -40, stripeWidth, 240);
                ctx.restore();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        }

        function createDecoratedBall(posX) {
            const group = new THREE.Group();
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.55, 28, 20),
                new THREE.MeshStandardMaterial({
                    color: 0xffd84d,
                    roughness: 0.35,
                    metalness: 0.35,
                    emissive: 0x331a00,
                    emissiveIntensity: 0.18
                })
            );
            group.add(sphere);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.42, 0.08, 10, 20),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.2,
                    metalness: 0.1,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0.25
                })
            );
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 16, 12),
                new THREE.MeshStandardMaterial({
                    color: 0xff3300,
                    roughness: 0.6,
                    metalness: 0.05,
                    emissive: 0x550000,
                    emissiveIntensity: 0.2
                })
            );
            group.add(core);

            group.position.set(posX, 0.55, -50);
            group.userData = { type: 'ball', isObstacle: true };
            return group;
        }

        function createDecoratedWall(posX) {
            const group = new THREE.Group();
            const texture = createStripedTexture('#b70000', '#f6d400', 16);
            const main = new THREE.Mesh(
                new THREE.BoxGeometry(2.7, 1.25, 0.55),
                new THREE.MeshStandardMaterial({
                    color: 0xaa1111,
                    map: texture,
                    roughness: 0.9,
                    metalness: 0.04,
                    emissive: 0x220000,
                    emissiveIntensity: 0.06
                })
            );
            main.position.y = 0.65;
            group.add(main);

            const topCap = new THREE.Mesh(
                new THREE.BoxGeometry(2.85, 0.15, 0.65),
                new THREE.MeshStandardMaterial({
                    color: 0x5a0000,
                    roughness: 0.75,
                    metalness: 0.05
                })
            );
            topCap.position.y = 1.28;
            group.add(topCap);

            const base = new THREE.Mesh(
                new THREE.BoxGeometry(2.85, 0.18, 0.65),
                new THREE.MeshStandardMaterial({
                    color: 0x4a0000,
                    roughness: 0.9,
                    metalness: 0.02
                })
            );
            base.position.y = -0.02;
            group.add(base);

            const braceGeo = new THREE.BoxGeometry(0.12, 1.05, 0.08);
            const braceMat = new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.5, metalness: 0.2 });
            const leftBrace = new THREE.Mesh(braceGeo, braceMat);
            leftBrace.position.set(-1.0, 0.68, 0.31);
            leftBrace.rotation.z = 0.06;
            group.add(leftBrace);

            const rightBrace = leftBrace.clone();
            rightBrace.position.x = 1.0;
            rightBrace.rotation.z = -0.06;
            group.add(rightBrace);

            group.position.set(posX, 0, -50);
            group.userData = { type: 'wall', isObstacle: true };
            return group;
        }

        function createDecoratedTunnel(posX) {
            const group = new THREE.Group();
            const outer = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 1.0, 16, 1, true, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide })
            );
            outer.rotation.z = Math.PI / 2;
            outer.rotation.y = Math.PI / 2;
            group.add(outer);

            const inner = new THREE.Mesh(
                new THREE.CylinderGeometry(1.26, 1.26, 0.92, 16, 1, true, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide })
            );
            inner.rotation.z = Math.PI / 2;
            inner.rotation.y = Math.PI / 2;
            group.add(inner);

            group.position.set(posX, 0.5, -50);
            group.userData = { type: 'tunnel', isObstacle: true };
            return group;
        }

        function createDecoratedPillar(posX) {
            const group = new THREE.Group();
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.58, 0.72, 4.0, 10, 1),
                new THREE.MeshStandardMaterial({
                    color: 0x6329b8,
                    roughness: 0.88,
                    metalness: 0.04,
                    emissive: 0x15002c,
                    emissiveIntensity: 0.05
                })
            );
            shaft.position.y = 2.0;
            group.add(shaft);

            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.88, 0.96, 0.28, 10),
                new THREE.MeshStandardMaterial({
                    color: 0x3f186f,
                    roughness: 0.9,
                    metalness: 0.02
                })
            );
            base.position.y = 0.14;
            group.add(base);

            const capital = new THREE.Mesh(
                new THREE.CylinderGeometry(0.78, 0.72, 0.28, 10),
                new THREE.MeshStandardMaterial({
                    color: 0x8d63ff,
                    roughness: 0.75,
                    metalness: 0.12
                })
            );
            capital.position.y = 3.86;
            group.add(capital);

            const bandMat = new THREE.MeshStandardMaterial({
                color: 0xe6d1ff,
                roughness: 0.4,
                metalness: 0.05,
                emissive: 0x2b103f,
                emissiveIntensity: 0.08
            });
            for (let y = 0.8; y <= 3.2; y += 0.8) {
                const band = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.06, 8, 14), bandMat);
                band.rotation.x = Math.PI / 2;
                band.position.y = y;
                group.add(band);
            }

            group.position.set(posX, 0, -50);
            group.userData = { type: 'pillar', isObstacle: true };
            return group;
        }

        function createDecoratedPlatform(posX, railLength) {
            const group = new THREE.Group();
            const deckGeo = new THREE.BoxGeometry(3.8, 0.45, railLength);
            const deckMat = createPlatformMaterial(0xb9933a);
            const deck = new THREE.Mesh(deckGeo, deckMat);
            deck.position.y = 0;
            deck.renderOrder = 10;
            group.add(deck);

            const plankTexture = createStripedTexture('#8b651f', '#d1b15a', 24);
            const plankMat = new THREE.MeshStandardMaterial({
                color: 0xb38c3c,
                map: plankTexture,
                roughness: 0.96,
                metalness: 0.01,
                fog: false
            });
            const plank = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.06, railLength - 0.25), plankMat);
            plank.position.set(0, 0.245, 0);
            plank.renderOrder = 11;
            group.add(plank);

            const leftRail = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 1.2, railLength),
                createPlatformMaterial(0x5b3a11)
            );
            leftRail.position.set(-1.8, 0.35, 0);
            leftRail.renderOrder = 11;
            group.add(leftRail);

            const rightRail = leftRail.clone();
            rightRail.position.x = 1.8;
            group.add(rightRail);

            const supportSpacing = 6;
            for (let z = -railLength * 0.5 + 2; z < railLength * 0.5; z += supportSpacing) {
                const support = new THREE.Mesh(
                    new THREE.BoxGeometry(0.35, 3.1, 0.35),
                    createPlatformMaterial(0x6a4216)
                );
                support.position.set(0, -1.1, z);
                support.renderOrder = 11;
                group.add(support);
            }

            const groupHalfDepth = railLength * 0.5;
            group.position.set(posX, 2.9, -50 - groupHalfDepth);
            group.userData = { type: 'platform', isObstacle: true, halfDepth: groupHalfDepth, halfHeight: 0.225 };
            return group;
        }

        // ==========================================
        // ゲームループ
        // ==========================================
        function animate() {
            requestAnimationFrame(animate);
            delta = clock.getDelta();

            if (isPlaying && !isPaused) {
                updateGame(delta);
            }
            
            // ▼▼▼ 追加 (GIFアニメーションの更新) ▼▼▼
            if (currentSkin === CUSTOM_SKIN_ID && isCustomSkinAnimated && player.material.map) {
                // GIFが設定されている場合、毎フレームテクスチャを更新
                player.material.map.needsUpdate = true;
            }
            // ▲▲▲ 追加 ▲▲▲

            renderer.render(scene, camera);
        }

        function updateGame(dt) {
            speed += dt * 0.2;
            score += Math.floor(speed * dt);
            distance += speed * dt; // 走行距離を加算
            
            // UI更新
            document.getElementById('score-val').innerText = score;
            document.getElementById('distance-val').innerText = Math.floor(distance);

            player.position.x += (targetX - player.position.x) * 10 * dt;

            if (isDroppingFromPlatform) {
                platformDropVelocity += gravity * dt * 0.75;
                player.position.y += platformDropVelocity * dt;
                player.scale.y = THREE.MathUtils.lerp(player.scale.y, 0.78, 10 * dt);
                if (player.position.y <= platformDropTargetY) {
                    player.position.y = platformDropTargetY;
                    isDroppingFromPlatform = false;
                    platformDropVelocity = 0;
                    player.scale.y = 1.0;
                    if (player.material) player.material.needsUpdate = true;
                }
            } else if (isJumping) {
                player.position.y += jumpVelocity * dt;
                jumpVelocity += gravity * dt;

                if (isCrouching) {
                    player.scale.y = THREE.MathUtils.lerp(player.scale.y, 0.5, 15 * dt);
                    if (player.position.y <= 0.375) { 
                        player.position.y = 0.375;
                        isJumping = false;
                        jumpVelocity = 0;
                        player.scale.y = 1.0;
                        if (player.material) player.material.needsUpdate = true;
                    }
                } else {
                    player.scale.y = THREE.MathUtils.lerp(player.scale.y, 1.0, 15 * dt);
                    if (player.position.y <= 0.75) {
                        player.position.y = 0.75;
                        isJumping = false;
                        jumpVelocity = 0;
                        player.scale.y = 1.0;
                        if (player.material) player.material.needsUpdate = true;
                    }
                }
            
            } else if (isCrouching) {
                player.scale.y = THREE.MathUtils.lerp(player.scale.y, 0.5, 15 * dt);
                player.position.y = 0.375;
                crouchTimer -= dt; 
                if (crouchTimer <= 0) { 
                    isCrouching = false;
                }

            } else {
                player.scale.y = THREE.MathUtils.lerp(player.scale.y, 1.0, 15 * dt);
                player.position.y = 0.75;
                if (!isCrouching) player.scale.y = 1.0;
            }

            handlePlatformLanding();
            player.lookAt(camera.position);

            if (Math.random() < 0.025) {
                spawnObstacle();
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                let obj = obstacles[i];
                obj.position.z += speed * dt;

                if (obj.userData.type === 'ball') {
                    obj.rotation.y += 5 * dt;
                    obj.rotation.x += 2 * dt;
                }

                if (Math.abs(obj.position.z - player.position.z) < 0.8) {
                    if (Math.abs(obj.position.x - player.position.x) < 1.0) {
                        checkCollision(obj, i);
                    }
                }

                const removalZ = obj.userData.type === 'platform'
                    ? obj.position.z - (obj.userData.halfDepth || 6)
                    : obj.position.z;

                if (removalZ > 5) {
                    if (obj === currentPlatform) {
                        beginPlatformDrop(0.75);
                    }
                    scene.remove(obj);
                    obstacles.splice(i, 1);
                }
            }
        }

        // ==========================================
        // 障害物・アイテム生成
        // ==========================================
        function spawnObstacle() {
            if (obstacles.length > 0) {
                const lastObj = obstacles[obstacles.length - 1];
                if (lastObj.position.z > -25) return;
            }

            const laneIndex = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const posX = laneIndex * LANE_WIDTH;
            let typeRand = Math.random();

            // 3連続で紫の壁(pillar)が出現するのを防ぐ
            if (lastObstacleTypes.length === 2 && lastObstacleTypes.every(t => t === 'pillar')) {
                typeRand = Math.random() * 0.7; // pillarでない障害物を強制的に生成
            }

            if (isLaneBlockedForSpawn(laneIndex)) return;

            let type = '';
            let mesh;

            if (typeRand < 0.2) {
                type = 'ball';
                mesh = createDecoratedBall(posX);
            } else if (typeRand < 0.5) {
                type = 'wall';
                mesh = createDecoratedWall(posX);
            } else if (typeRand < 0.7) {
                type = 'tunnel';
                mesh = createDecoratedTunnel(posX);
            } else if (typeRand < 0.85) {
                type = 'pillar';
                mesh = createDecoratedPillar(posX);
            } else {
                const railLength = 18 + Math.floor(Math.random() * 3) * 6;
                type = 'platform';
                mesh = createDecoratedPlatform(posX, railLength);
            }

            // 履歴を更新
            lastObstacleTypes.push(type);
            if (lastObstacleTypes.length > 2) {
                lastObstacleTypes.shift();
            }

            if (type !== 'platform') {
                mesh.userData = { type: type, isObstacle: true };
            }
            scene.add(mesh);
            obstacles.push(mesh);
        }

        function isPlayerOverPlatform(obj) {
            const halfDepth = obj.userData.halfDepth || 6;
            const halfWidth = 1.8;
            return (
                Math.abs(obj.position.x - player.position.x) <= halfWidth &&
                player.position.z >= obj.position.z - halfDepth &&
                player.position.z <= obj.position.z + halfDepth
            );
        }

        function beginPlatformDrop(targetY = 0.75) {
            if (isDroppingFromPlatform) return;
            isOnPlatform = false;
            currentPlatform = null;
            currentPlatformTopY = targetY;
            currentPlatformHalfDepth = 0;
            isDroppingFromPlatform = true;
            platformDropVelocity = Math.min(platformDropVelocity, 0);
            platformDropTargetY = targetY;
            isJumping = false;
            jumpVelocity = 0;
        }

        function findNearbyPlatform(laneX, playerZ) {
            let best = null;
            let bestScore = Infinity;

            for (const obj of obstacles) {
                if (obj.userData.type !== 'platform') continue;
                const halfDepth = obj.userData.halfDepth || 6;
                const halfWidth = 2.5;
                const withinLane = Math.abs(obj.position.x - laneX) <= halfWidth;
                const withinZ = playerZ >= obj.position.z - halfDepth && playerZ <= obj.position.z + halfDepth;
                if (!withinLane || !withinZ) continue;

                const score = Math.abs(obj.position.x - laneX) + Math.abs(playerZ - obj.position.z) * 0.2;
                if (score < bestScore) {
                    best = obj;
                    bestScore = score;
                }
            }

            return best;
        }

        function handlePlatformLanding() {
            if (isDroppingFromPlatform) return;

            if (isJumping && jumpVelocity <= 0) {
                for (const obj of obstacles) {
                    if (obj.userData.type !== 'platform') continue;
                    const halfDepth = obj.userData.halfDepth || 6;
                    if (!isPlayerOverPlatform(obj)) continue;

                    const topY = obj.position.y + (obj.userData.halfHeight || 0.225) + 0.75;
                    const fallingTowardTop = player.position.y >= topY - 1.8 && player.position.y <= topY + 1.2;
                    if (fallingTowardTop) {
                        isOnPlatform = true;
                        currentPlatform = obj;
                        currentPlatformTopY = topY;
                        currentPlatformHalfDepth = halfDepth;
                        player.position.y = topY;
                        isJumping = false;
                        jumpVelocity = 0;
                        break;
                    }
                }

            }

            if (isOnPlatform && currentPlatform) {
                const targetPlatform = findNearbyPlatform(targetX, player.position.z);
                if (targetPlatform && targetPlatform !== currentPlatform && Math.abs(targetPlatform.position.x - player.position.x) <= 3.0) {
                    currentPlatform = targetPlatform;
                    currentPlatformHalfDepth = targetPlatform.userData.halfDepth || 6;
                    const topY = targetPlatform.position.y + (targetPlatform.userData.halfHeight || 0.225) + 0.75;
                    currentPlatformTopY = topY;
                    player.position.y = topY;
                    player.scale.y = 1.0;
                }

                currentPlatformTopY = currentPlatform.position.y + (currentPlatform.userData.halfHeight || 0.225) + 0.75;
                player.position.y = currentPlatformTopY;
                player.scale.y = 1.0;
                if (!isPlayerOverPlatform(currentPlatform)) {
                    const adjacent = findNearbyPlatform(targetX, player.position.z);
                    if (adjacent && adjacent !== currentPlatform && Math.abs(adjacent.position.x - player.position.x) <= 3.0) {
                        currentPlatform = adjacent;
                        currentPlatformHalfDepth = adjacent.userData.halfDepth || 6;
                        currentPlatformTopY = adjacent.position.y + (adjacent.userData.halfHeight || 0.225) + 0.75;
                        player.position.y = currentPlatformTopY;
                        player.scale.y = 1.0;
                    } else {
                        beginPlatformDrop(0.75);
                    }
                }
            }
        }

        // ==========================================
        // 当たり判定ロジック
        // ==========================================
        function checkCollision(obj, index) {
            const type = obj.userData.type;

            if (type === 'ball') {
                mutekiBalls++;
                score += 1000;
                updateMutekiCountUI();
                updateAwakeningUI(); 
                saveData(); 
                scene.remove(obj);
                obstacles.splice(index, 1);
            } else if (type === 'wall') {
                if (player.position.y < 1.2) {
                    gameOver();
                }
            } else if (type === 'tunnel') {
                if (!isCrouching) {
                    gameOver();
                }
            } else if (type === 'pillar') {
                gameOver();
            } else if (type === 'platform') {
                // 足場は障害物ではなく乗れる地形なので、接触しても何もしない
            }
        }

        function isLaneBlockedForSpawn(laneIndex) {
            const x = laneIndex * LANE_WIDTH;
            const spawnZ = -55;
            const minGapZ = 14;

            for (const obj of obstacles) {
                if (Math.abs(obj.position.x - x) > 0.9) continue;
                if (Math.abs(obj.position.z - spawnZ) < minGapZ) return true;

                if (obj.userData.type === 'platform') {
                    const halfDepth = obj.userData.halfDepth || 6;
                    if (spawnZ >= obj.position.z - halfDepth - 2 && spawnZ <= obj.position.z + halfDepth + 2) {
                        return true;
                    }
                }
            }
            return false;
        }

        // 無敵ボールのUIを更新する関数
        function updateMutekiCountUI() {
            document.getElementById('muteki-count').innerText = `無敵ボール: ${mutekiBalls}個`;
        }

        // ==========================================
        // 入力処理 (スマホスワイプ対応)
        // ==========================================
        function setupInputs() {
            document.addEventListener('keydown', (e) => {
                if (!isPlaying) return;

                if (e.code === 'KeyP' || e.code === 'Escape') {
                    togglePause();
                    return; 
                }
                if (isPaused) return; 

                if (e.code === 'ArrowLeft') moveLane(-1);
                if (e.code === 'ArrowRight') moveLane(1);
                if (e.code === 'ArrowUp') doJump();
                if (e.code === 'ArrowDown') doCrouch();
            });

            let touchStartX = 0;
            let touchStartY = 0;

            document.addEventListener('touchstart', (e) => {
                if (!isPlaying || isPaused) return; 
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                if (!isPlaying || isPaused) return;
                let touchEndX = e.changedTouches[0].clientX;
                let touchEndY = e.changedTouches[0].clientY;
                let diffX = touchEndX - touchStartX;
                let diffY = touchEndY - touchStartY;

                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > 30) {
                        if (diffX > 0) moveLane(1);
                        else moveLane(-1);
                    }
                } 
                else {
                    if (Math.abs(diffY) > 30) {
                        if (diffY < 0) doJump();
                        else doCrouch();
                    }
                }
            }, false);
        }

        function moveLane(dir) {
            currentLane += dir;
            if (currentLane < -1) currentLane = -1;
            if (currentLane > 1) currentLane = 1;
            targetX = currentLane * LANE_WIDTH;
        }

        function doJump() {
            if (!isJumping) {
                isOnPlatform = false;
                currentPlatform = null;
                currentPlatformHalfDepth = 0;
                isJumping = true;
                jumpVelocity = 12;
            }
        }

        function doCrouch() {
            if (isJumping) {
                if (jumpVelocity > -15) { 
                    jumpVelocity = -25;
                }
            } else { 
                isCrouching = true;
                crouchTimer = 0.8; 
            }
        }

        // ==========================================
        // ゲーム進行管理
        // ==========================================

        function togglePause() {
            if (!isPlaying) return; 

            isPaused = !isPaused;
            const pauseScreen = document.getElementById('pause-screen');

            if (isPaused) {
                pauseScreen.classList.remove('hidden');
                if (bgmElement) {
                    bgmElement.pause(); 
                }
            } else {
                pauseScreen.classList.add('hidden');
                playBGM(); 
            }
        }

        function returnToStart() {
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('pause-button').classList.add('hidden');
            
            isPlaying = false;
            isPaused = false;
            
            if (bgmElement) {
                bgmElement.pause();
                bgmElement.currentTime = 0; 
            }

            document.getElementById('start-screen').classList.remove('hidden');
            
            obstacles.forEach(o => scene.remove(o));
            obstacles = [];
            resetGameVals();
            updateSkinSelectorUI();
            updateHighScoreUI(); 
            updateAwakeningUI(); 
        }


        function startGame(isAwakening = false) { 
            document.getElementById('start-screen').classList.add('hidden');
            resetGameVals(isAwakening); 
            isPlaying = true;
            playBGM(); 
            document.getElementById('pause-button').classList.remove('hidden'); 
        }

        function gameOver() {
            isPlaying = false;
            document.getElementById('pause-button').classList.add('hidden'); 
            
            if (score > highScore) {
                highScore = score;
            }
            const finalDist = Math.floor(distance);
            if (finalDist > highDistance) {
                highDistance = finalDist;
            }
            saveData(); 
            updateHighScoreUI();
            updateAwakeningUI(); 
            
            document.getElementById('game-over-screen').classList.remove('hidden');
            document.getElementById('final-score').innerText = score;
            document.getElementById('final-distance').innerText = finalDist;
            updateSkinSelectorUI();
        }

        function resetGame(isAwakening = false) { 
            document.getElementById('game-over-screen').classList.add('hidden');
            resetGameVals(isAwakening); 
            obstacles.forEach(o => scene.remove(o));
            obstacles = [];
            isPlaying = true;
            playBGM(); 
            document.getElementById('pause-button').classList.remove('hidden'); 
        }

        function resetGameVals(isAwakening = false) { 
            if (isAwakening) {
                score = AWAKENING_START_SCORE;
                speed = AWAKENING_START_SPEED;
                distance = AWAKENING_START_DISTANCE;
            } else {
                score = 0;
                speed = 15;
                distance = 0; 
            }
            
            currentLane = 0;
            targetX = 0;
            player.position.x = 0;
            
            isJumping = false;
            isCrouching = false;
            isPaused = false; 
            jumpVelocity = 0;
            crouchTimer = 0;
            isOnPlatform = false;
            currentPlatform = null;
            currentPlatformTopY = 0.75;
            
            document.getElementById('score-val').innerText = score;
            document.getElementById('distance-val').innerText = Math.floor(distance);
            updateMutekiCountUI();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // ==========================================
        // BGM管理 & アップロード機能 (★変更箇所)
        // ==========================================

        function setupBGMUploader() {
            const input = document.getElementById('bgm-upload-input');
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // オブジェクトURLを生成してBGMソースに設定
                    const objectUrl = URL.createObjectURL(file);
                    bgmElement.src = objectUrl;
                    
                    // 強制的にONにする
                    isBGMEnabled = true;
                    updateBGMButtonUI();
                    playBGM();
                    
                    alert("BGMを変更しました！(※再読み込みでリセットされます)");
                }
                // input値をリセットして同じファイルを再選択できるようにする
                input.value = '';
            });
        }

        function triggerBGMUpload() {
            document.getElementById('bgm-upload-input').click();
        }

        function resetDefaultBGM() {
            bgmElement.src = DEFAULT_BGM_SRC;
            alert("デフォルトのBGMに戻しました。");
            if (isBGMEnabled) {
                playBGM();
            }
        }

        function playBGM() {
            if (isBGMEnabled && bgmElement && !isPaused) {
                bgmElement.muted = false; 
                const promise = bgmElement.play();
                if (promise !== undefined) {
                    promise.catch(error => {
                        console.warn("BGMの自動再生がブロックされました。", error);
                        isBGMEnabled = false; 
                        bgmElement.muted = true;
                        saveBGMSetting();
                        updateBGMButtonUI();
                    });
                }
            }
        }

        function toggleBGM() {
            isBGMEnabled = !isBGMEnabled;
            
            if (isBGMEnabled) {
                playBGM(); 
            } else {
                bgmElement.pause(); 
                bgmElement.muted = true;
            }
            
            saveBGMSetting();
            updateBGMButtonUI();
        }

        function updateBGMButtonUI() {
            const text = isBGMEnabled ? "BGM: ON" : "BGM: OFF";
            const color = isBGMEnabled ? "linear-gradient(45deg, #0f0, #0a0)" : "#444"; 
            
            const btn1 = document.getElementById('bgm-toggle-start');
            if (btn1) {
                btn1.innerText = text;
                btn1.style.background = color;
            }
            
            const btn2 = document.getElementById('bgm-toggle-over');
            if (btn2) {
                btn2.innerText = text;
                btn2.style.background = color;
            }
        }

        function saveBGMSetting() {
            try {
                localStorage.setItem(BGM_SAVE_KEY, JSON.stringify({ enabled: isBGMEnabled }));
            } catch (e) {
                console.error("BGM設定の保存に失敗", e);
            }
        }

        function loadBGMSetting() {
            try {
                const setting = localStorage.getItem(BGM_SAVE_KEY);
                if (setting) {
                    isBGMEnabled = JSON.parse(setting).enabled || false;
                }
            } catch (e) {
                console.error("BGM設定のロードに失敗", e);
                isBGMEnabled = false;
            }
        }

        // ==========================================
        // スキン選択システム
        // ==========================================

        function updateSkinSelectorUI() {
            const selectors = document.querySelectorAll('.skin-selector');
            if (selectors.length === 0) return;

            selectors.forEach(selector => {
                selector.innerHTML = ''; 
                ownedSkins.forEach(skinName => {
                    const option = document.createElement('option');
                    option.value = skinName;
                    
                    if (skinName === CUSTOM_SKIN_ID) {
                        option.innerText = 'オリジナル同志';
                    } else {
                        option.innerText = skinName.replace('.png', '').replace('.jpg', ''); 
                    }

                    if (skinName === currentSkin) {
                        option.selected = true;
                    }
                    selector.appendChild(option);
                });
            });
        }

        function changeSkin(skinName) {
            if (ownedSkins.has(skinName)) {
                applySkin(skinName);
                saveData(); 
                console.log(`スキンを ${skinName} に変更しました。`);
                updateSkinSelectorUI();
            }
        }

        // ==========================================
        // ガチャシステム (大改修)
        // ==========================================

        // ▼ 追加: ガチャ選択画面の表示
        function openGachaSelection() {
            document.getElementById('gacha-selection-screen').classList.remove('hidden');
            document.getElementById('gacha-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-over-screen').classList.add('hidden');
        }

        // ▼ 追加: ガチャ選択画面を閉じる
        function closeGachaSelection() {
            document.getElementById('gacha-selection-screen').classList.add('hidden');
            if (isPlaying || isPaused) {
                document.getElementById('pause-screen').classList.remove('hidden');
            } else {
                document.getElementById('start-screen').classList.remove('hidden');
            }
        }

        // ▼ 変更: 選択されたガチャ画面の表示
        function openGacha(type) {
            currentGachaType = type;
            document.getElementById('gacha-selection-screen').classList.add('hidden');
            document.getElementById('gacha-screen').classList.remove('hidden');
            
            document.getElementById('gacha-result').innerText = "";
            document.getElementById('gacha-muteki-count').innerText = mutekiBalls;
            
            updateGachaScreen(type);
        }

        // ▼ 追加: ガチャ画面のUIを更新
        function updateGachaScreen(type) {
            const img = document.getElementById('torotuki-img');
            const gachaButton = document.getElementById('gacha-button');
            const pickaxe = document.getElementById('pickaxe');
            const gachaTitle = document.getElementById('gacha-title');
            const gachaCostText = document.getElementById('gacha-cost-text');
            let cost = 0;

            pickaxe.style.opacity = '0';
            pickaxe.style.transform = 'translate(0, 0) rotate(0deg)';

            if (type === 'normal') {
                cost = NORMAL_GACHA_COST;
                gachaTitle.innerText = "トロツキーワクワクガチャ";
                img.src = TOROTUKI_IMG_SRC;
                gachaButton.innerText = `ピッケル投擲 (${cost}個消費)`;
                // ▼ 修正: レア同志が出ないことを明記
                gachaCostText.innerHTML = `1回: 無敵ボール ${cost}個<br>一般同志`;
                gachaButton.onclick = runNormalGacha;
            } else if (type === 'rare') {
                cost = RARE_GACHA_COST;
                gachaTitle.innerText = "資本主義の奴隷ガチャ";
                img.src = BERLIN_WALL_IMG_SRC; // 新しいターゲット画像
                gachaButton.innerText = `ピッケル投擲 (${cost}個消費)`;
                gachaCostText.innerHTML = `1回: 無敵ボール ${cost}個<br><span style="color: #f00;">レア同志以外は虚無（何も得られない）</span>`;
                gachaButton.onclick = runRareGacha;
            } else if (type === 'schlieffen') {
                cost = 30;
                gachaTitle.innerText = "Schlieffen-Plan";
                img.src = 'schlieffen.png';
                gachaButton.innerText = `ピッケル投擲 (${cost}個消費)`;
                gachaCostText.innerHTML = `1回: 無敵ボール ${cost}個<br>期間限定同志`;
                gachaButton.onclick = runSchlieffenGacha;
            } else {
                // ここには来ない想定
                return;
            }

            // 画像エラーハンドリング (再設定)
            img.onerror = function() {
                const c = document.createElement('canvas');
                c.width = 200; c.height = 200;
                const x = c.getContext('2d');
                x.fillStyle = '#ccc'; x.fillRect(0,0,200,200);
                x.fillStyle = '#000'; x.font = '30px Arial'; x.textAlign = 'center';
                x.fillText('Target', 100, 100);
                img.src = c.toDataURL();
            };

            gachaButton.disabled = (mutekiBalls < cost);
        }

        // ▼ 変更: ガチャ画面から選択画面へ戻る
        function closeGacha() {
            document.getElementById('gacha-screen').classList.add('hidden');
            openGachaSelection(); // ガチャ選択画面に戻る
        }

        // ▼ 変更: runGachaを削除し、runGachaHandlerで分岐
        function runGachaHandler() {
            if (currentGachaType === 'normal') {
                runNormalGacha();
            } else if (currentGachaType === 'rare') {
                runRareGacha();
            } else if (currentGachaType === 'schlieffen') {
                runSchlieffenGacha();
            }
        }

        // ▼ 追加: ノーマルガチャの実行ロジック (レア排出ロジックを削除)
        function runNormalGacha() {
            const cost = NORMAL_GACHA_COST;
            if (mutekiBalls < cost) {
                document.getElementById('gacha-result').innerText = "無敵ボールが足りません！";
                return;
            }

            const gachaButton = document.getElementById('gacha-button');
            gachaButton.disabled = true;

            mutekiBalls -= cost;
            updateMutekiCountUI(); 
            document.getElementById('gacha-muteki-count').innerText = mutekiBalls; 
            updateAwakeningUI(); 
            
            const pickaxe = document.getElementById('pickaxe');
            const imgContainer = document.getElementById('torotuki-container');
            
            pickaxe.style.opacity = '1';
            pickaxe.style.top = '-50px';
            pickaxe.style.right = '-50px';
            
            setTimeout(() => {
                pickaxe.style.transform = 'translate(-80px, 80px) rotate(-45deg)'; 
                
                setTimeout(() => {
                    imgContainer.classList.add('shake');
                    
                    setTimeout(() => {
                        imgContainer.classList.remove('shake');
                        
                        let newSkin = "";
                        let resultText = "";
                        
                        // レアスキン（トロツキー）判定ロジックを完全に削除しました。
                        // 常にノーマルスキンのみを抽選します。

                        // 未所持のノーマルスキンを探す
                        const availableNormalSkins = SKIN_LIST.filter(s => !ownedSkins.has(s) && s !== CUSTOM_SKIN_ID && s !== TOROTUKI_IMG_SRC);
                        
                        if (availableNormalSkins.length > 0) {
                            // 未所持のノーマルスキンがあれば確定排出
                            newSkin = availableNormalSkins[Math.floor(Math.random() * availableNormalSkins.length)];
                            ownedSkins.add(newSkin);
                            updateSkinSelectorUI(); 
                            resultText = `新規同志 [${newSkin}] を召喚！`;
                        } else {
                            // 全て所持していれば、ランダムで再排出
                            // カスタムスキンとレア判定画像を除外したリストから選ぶ
                            const allNormalSkins = SKIN_LIST.filter(s => s !== CUSTOM_SKIN_ID && s !== TOROTUKI_IMG_SRC);
                            newSkin = allNormalSkins[Math.floor(Math.random() * allNormalSkins.length)];
                            resultText = `同志 [${newSkin}] は既に所持しています`;
                        }
                        
                        // ★★★ 修正箇所: innerText -> innerHTML ★★★
                        document.getElementById('gacha-result').innerHTML = resultText;
                        saveData();

                        if (mutekiBalls >= cost) {
                            gachaButton.disabled = false;
                        }

                    }, 500);
                }, 300);
            }, 100);
        }
        
        // ▼ 追加: レアガチャの実行ロジック
        function runRareGacha() {
            const cost = RARE_GACHA_COST;
            if (mutekiBalls < cost) {
                document.getElementById('gacha-result').innerText = "無敵ボールが足りません！";
                return;
            }

            const gachaButton = document.getElementById('gacha-button');
            gachaButton.disabled = true;

            mutekiBalls -= cost;
            updateMutekiCountUI(); 
            document.getElementById('gacha-muteki-count').innerText = mutekiBalls; 
            updateAwakeningUI();
            
            const pickaxe = document.getElementById('pickaxe');
            const imgContainer = document.getElementById('torotuki-container');
            
            pickaxe.style.opacity = '1';
            pickaxe.style.top = '-50px';
            pickaxe.style.right = '-50px';
            
            setTimeout(() => {
                pickaxe.style.transform = 'translate(-80px, 80px) rotate(-45deg)'; 
                
                setTimeout(() => {
                    imgContainer.classList.add('shake');
                    
                    setTimeout(() => {
                        imgContainer.classList.remove('shake');
                        
                        let newSkin = "";
                        let resultText = "";
                        let hit = false;
                        const rand = Math.random();
                        let cumulativeRate = 0.0;
                        
                        // ★修正★: トロツキー(torotuki)を除外するフィルタを削除し、排出可能にしました。
                        // const rareSkinsExcludingTrotsky = RARE_SKINS.filter(s => s.name !== TOROTUKI_IMG_SRC); 

                        // レアスキン判定
                        for (const rare of RARE_SKINS) { // 全てのレアスキンから判定
                            cumulativeRate += rare.rate;
                            if (rand < cumulativeRate) {
                                newSkin = rare.name;
                                if (ownedSkins.has(newSkin)) {
                                    resultText = `★${rare.rarity}!!★ [${newSkin}] は既に所持しています`;
                                } else {
                                    ownedSkins.add(newSkin);
                                    updateSkinSelectorUI(); 
                                    resultText = `<span style="color: #f0f;">★★★${rare.rarity}同志 [${newSkin}] を召喚!!!★★★</span>`;
                                }
                                hit = true;
                                break; 
                            }
                        }

                        // 虚無判定 (レアスキンにヒットしなかった場合)
                        if (!hit) {
                            resultText = `<span style="color: #aaa;">虚無... 資本主義の奴隷からは何も得られませんでした...</span>`;
                        }
                        
                        document.getElementById('gacha-result').innerHTML = resultText;
                        saveData();

                        if (mutekiBalls >= cost) {
                            gachaButton.disabled = false;
                        }

                    }, 500);
                }, 300);
            }, 100);
        }

        function runSchlieffenGacha() {
            const cost = 30;
            if (mutekiBalls < cost) {
                document.getElementById('gacha-result').innerText = "無敵ボールが足りません！";
                return;
            }

            const gachaButton = document.getElementById('gacha-button');
            gachaButton.disabled = true;

            mutekiBalls -= cost;
            updateMutekiCountUI(); 
            document.getElementById('gacha-muteki-count').innerText = mutekiBalls; 
            updateAwakeningUI();
            
            const pickaxe = document.getElementById('pickaxe');
            const imgContainer = document.getElementById('torotuki-container');
            
            pickaxe.style.opacity = '1';
            pickaxe.style.top = '-50px';
            pickaxe.style.right = '-50px';
            
            setTimeout(() => {
                pickaxe.style.transform = 'translate(-80px, 80px) rotate(-45deg)'; 
                
                setTimeout(() => {
                    imgContainer.classList.add('shake');
                    
                    setTimeout(() => {
                        imgContainer.classList.remove('shake');
                        
                        let newSkin = "";
                        let resultText = "";
                        
                        const rand = Math.random();
                        let cumulativeRate = 0.0;
                        
                        const gachaPool = SCHLIEFFEN_SKINS.map(skin => {
                            let rate = 0;
                            if (skin.rarity === "通常") {
                                rate = 0.2;
                            } else if (skin.rarity === "レア") {
                                rate = 0.1;
                            }
                            return { ...skin, rate };
                        });

                        for (const skin of gachaPool) {
                            cumulativeRate += skin.rate;
                            if (rand < cumulativeRate) {
                                newSkin = skin.name;
                                if (ownedSkins.has(newSkin)) {
                                    resultText = `★${skin.rarity}!!★ [${newSkin}] は既に所持しています`;
                                } else {
                                    ownedSkins.add(newSkin);
                                    updateSkinSelectorUI(); 
                                    resultText = `<span style="color: #f0f;">★★★${skin.rarity}同志 [${newSkin}] を召喚!!!★★★</span>`;
                                }
                                break; 
                            }
                        }
                        
                        document.getElementById('gacha-result').innerHTML = resultText;
                        saveData();

                        if (mutekiBalls >= cost) {
                            gachaButton.disabled = false;
                        }

                    }, 500);
                }, 300);
            }, 100);
        }
        // ▲ 追加 ▲

        // ==========================================
        // ★★★ スキン一覧 & ハイスコアUI ★★★
        // ==========================================

        function updateHighScoreUI() {
            const hsStart = document.getElementById('high-score-start');
            const hdStart = document.getElementById('high-distance-start');
            const hsOver = document.getElementById('high-score-over');
            const hdOver = document.getElementById('high-distance-over');
            
            if (hsStart) hsStart.innerText = highScore;
            if (hdStart) hdStart.innerText = highDistance;
            if (hsOver) hsOver.innerText = highScore;
            if (hdOver) hdOver.innerText = highDistance;
        }

        function openSkinListScreen() {
            document.getElementById('skin-list-screen').classList.remove('hidden');
            populateSkinList();
        }

        function closeSkinListScreen() {
            document.getElementById('skin-list-screen').classList.add('hidden');
        }

        function populateSkinList() {
            const container = document.getElementById('skin-list-container');
            container.innerHTML = ''; 
            
            const defaultSkin = 'player.png';
            const rareSkinNames = RARE_SKINS.map(s => s.name);
            const normalSkinNames = SKIN_LIST.filter(s => s !== defaultSkin && !rareSkinNames.includes(s) && s !== CUSTOM_SKIN_ID);

            let html = '';
            
            if (ownedSkins.has(CUSTOM_SKIN_ID)) {
                html += `<h3 style="color: #0f0;">オリジナル同志</h3>`;
                html += createSkinListEntry(CUSTOM_SKIN_ID, null);
            }

            // Default Skin
            html += `<h3>デフォルト</h3>`;
            html += createSkinListEntry(defaultSkin, null);
            
            // Rare Skins
            html += `<h3 style="color: #ffaa00;">革命的同志 (レア)</h3>`;
            RARE_SKINS.forEach(rareInfo => {
                html += createSkinListEntry(rareInfo.name, rareInfo);
            });

            // Normal Skins
            html += `<h3 style="color: #ccc;">一般同志</h3>`;
            normalSkinNames.forEach(skinName => {
                html += createSkinListEntry(skinName, null);
            });

            container.innerHTML = html;
        }

        function createSkinListEntry(skinName, rareInfo) {
            const isOwned = ownedSkins.has(skinName);

            let nameDisplay = skinName.replace('.png', '').replace('.jpg', '');
            if (skinName === CUSTOM_SKIN_ID) {
                nameDisplay = 'オリジナル同志';
            }

            let probabilityText = "";

            if (rareInfo) {
                let percent = (rareInfo.rate * 100).toFixed(3).replace(/\.?0+$/, ""); // 小数点以下を整形
                
                // ★修正★: 常に「レアガチャ」と表示するように条件分岐を削除
                probabilityText = ` (${rareInfo.rarity}, レアガチャ ${percent}%)`;
            
            } else if (skinName === CUSTOM_SKIN_ID) {
                probabilityText = isCustomSkinAnimated ? " (カスタム, GIF)" : " (カスタム)";
            } else if (skinName !== 'player.png') {
                probabilityText = " (ノーマルガチャ)";
            } else {
                probabilityText = " (初期)";
            }
            
            const ownedClass = isOwned ? 'owned' : 'not-owned';
            const ownedText = isOwned ? '[所持]' : '[未所持]';
            
            let entry = `<div>
                            <span class="${ownedClass}">${ownedText} ${nameDisplay}</span>
                            <span class="skin-prob">${probabilityText}</span>
                         </div>`;
            return entry;
        }

        // ==========================================
        // ★★★ カスタムスキン機能 ★★★ (GIF対応)
        // ==========================================

        function setupCustomSkinUploader() {
            const uploader = document.getElementById('custom-skin-upload');
            const preview = document.getElementById('custom-skin-preview');
            const saveButton = document.getElementById('custom-skin-save');

            uploader.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    saveButton.dataset.fileType = file.type; 

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        saveButton.disabled = false;
                    };
                    reader.readAsDataURL(file);
                } else {
                    preview.src = '';
                    preview.style.display = 'none';
                    saveButton.disabled = true;
                    saveButton.dataset.fileType = ''; 
                }
            });
        }

        function openCustomSkinScreen() {
            document.getElementById('custom-skin-screen').classList.remove('hidden');
            // UIをリセット
            document.getElementById('custom-skin-upload').value = null;
            document.getElementById('custom-skin-preview').style.display = 'none';
            document.getElementById('custom-skin-save').disabled = true;
            document.getElementById('custom-skin-save').dataset.fileType = '';
        }

        function closeCustomSkinScreen() {
            document.getElementById('custom-skin-screen').classList.add('hidden');
        }

        function saveCustomSkin() {
            const preview = document.getElementById('custom-skin-preview');
            const saveButton = document.getElementById('custom-skin-save');
            const dataURL = preview.src;
            const fileType = saveButton.dataset.fileType; 

            if (dataURL) {
                try {
                    // カスタムスキンを専用キーでlocalStorageに保存
                    localStorage.setItem(CUSTOM_SKIN_KEY, dataURL);
                    customSkinDataURL = dataURL; 
                    
                    if (fileType === 'image/gif') {
                        localStorage.setItem(CUSTOM_SKIN_TYPE_KEY, 'gif');
                        isCustomSkinAnimated = true;
                        customSkinGifElement.src = dataURL; // <img>要素にすぐ反映
                    } else {
                        localStorage.setItem(CUSTOM_SKIN_TYPE_KEY, 'static');
                        isCustomSkinAnimated = false;
                    }
                    
                    if (!ownedSkins.has(CUSTOM_SKIN_ID)) {
                        ownedSkins.add(CUSTOM_SKIN_ID);
                    }
                    
                    // 新しいスキンを即座に適用し、(currentSkinとして)保存する
                    changeSkin(CUSTOM_SKIN_ID); // これが applySkin と saveData を呼ぶ
                    updateSkinSelectorUI(); // ドロップダウンを更新

                    alert("オリジナル同志を作成しました！");
                    closeCustomSkinScreen();

                } catch (e) {
                    console.error("カスタムスキンの保存に失敗", e);
                    alert("スキンの保存に失敗しました。画像が大きすぎる可能性があります。");
                }
            }
        }

        // ==========================================
        // データ引き継ぎ (セーブ/ロード)
        // ==========================================

        function saveData() {
            try {
                const data = {
                    skins: Array.from(ownedSkins),
                    balls: mutekiBalls,
                    skin: currentSkin,
                    highScore: highScore, 
                    highDistance: highDistance,
                    isAwakeningUnlocked: isAwakeningUnlocked 
                };
                // ★注意: ここにはカスタムスキンの画像データ(dataURL)は含まれない
                localStorage.setItem(SAVE_DATA_KEY, JSON.stringify(data));
                console.log("データを保存しました。", data);
            } catch (e) {
                console.error("セーブに失敗しました。", e);
            }
        }

        function loadData() {
            // 1. メインのセーブデータをロード
            try {
                const jsonData = localStorage.getItem(SAVE_DATA_KEY);
                if (jsonData) {
                    const data = JSON.parse(jsonData);
                    
                    ownedSkins = new Set(data.skins || ['player.png']); 
                    mutekiBalls = data.balls || 0;
                    currentSkin = data.skin || 'player.png';
                    highScore = data.highScore || 0; 
                    highDistance = data.highDistance || 0; 
                    isAwakeningUnlocked = data.isAwakeningUnlocked || false; 
                    
                    console.log("メインデータをロードしました。", data);
                    
                    updateMutekiCountUI();
                }
            } catch (e) {
                console.error("ロードに失敗しました。", e);
            }

            // 2. カスタムスキンデータをロード
            try {
                const customData = localStorage.getItem(CUSTOM_SKIN_KEY);
                const customType = localStorage.getItem(CUSTOM_SKIN_TYPE_KEY); 

                if (customData) {
                    // カスタムスキンデータ(DataURL)が存在する場合
                    customSkinDataURL = customData;
                    ownedSkins.add(CUSTOM_SKIN_ID); // 所有リストに強制追加
                    
                    if (customType === 'gif') {
                        isCustomSkinAnimated = true;
                        customSkinGifElement.src = customSkinDataURL; // <img>にセット
                    } else {
                        isCustomSkinAnimated = false;
                    }

                } else {
                    // カスタムスキンデータが存在しない場合 (キャッシュクリアなど)
                    customSkinDataURL = null;
                    isCustomSkinAnimated = false; // リセット
                    ownedSkins.delete(CUSTOM_SKIN_ID); // 所有リストから削除
                    if (currentSkin === CUSTOM_SKIN_ID) {
                        currentSkin = 'player.png'; // デフォルトに戻す
                    }
                }
            } catch (e) {
                console.error("カスタムスキンのロードに失敗", e);
                isCustomSkinAnimated = false;
            }

            // 3. 最終的なスキンを適用
            if (player) { 
                applySkin(currentSkin);
            }
            
            // 4. UIを更新
            updateSkinSelectorUI();
            updateHighScoreUI(); 
            updateAwakeningUI(); 
        }

        // --- 引き継ぎ画面UI ---
        function openSaveLoadScreen() {
            document.getElementById('save-load-screen').classList.remove('hidden');
            document.getElementById('save-load-code').value = ''; 
        }
        
        function closeSaveLoadScreen() {
            document.getElementById('save-load-screen').classList.add('hidden');
        }

        function generateSaveCode() {
            saveData(); // ★最新のデータを保存 (カスタムスキンのDataURLは含まない)
            const jsonData = localStorage.getItem(SAVE_DATA_KEY);
            if (jsonData) {
                try {
                    const base64Code = btoa(jsonData);
                    document.getElementById('save-load-code').value = base64Code;
                    alert("引き継ぎコードを発行しました。テキストエリアのコードをコピーしてください。");
                } catch (e) {
                    alert("コードの発行に失敗しました。");
                }
            }
        }

        function executeLoadCode() {
            const base64Code = document.getElementById('save-load-code').value;
            if (!base64Code) {
                alert("コードを入力してください。");
                return;
            }
            
            try {
                const jsonData = atob(base64Code);
                const data = JSON.parse(jsonData); 
                
                if (data && typeof data.skins !== 'undefined' && typeof data.balls !== 'undefined') {
                    // メインデータのみを保存
                    localStorage.setItem(SAVE_DATA_KEY, jsonData);
                    
                    // ★重要: カスタムスキンデータ(KEY/TYPE_KEY)は上書きしない
                    
                    alert("データのロードに成功しました。ゲームを再読み込みします。");
                    location.reload(); 
                } else {
                    throw new Error("無効なデータ形式です。");
                }
            } catch (e) {
                console.error("ロード失敗:", e);
                alert("無効なコードです。データ復元に失敗しました。");
            }
        }

        // ==========================================
        // 覚醒スタート用
        // ==========================================

        function updateAwakeningUI() {
            const unlockBtn = document.getElementById('awakening-unlock-btn');
            const startBtn = document.getElementById('awakening-start-btn');
            const unlockBtnOver = document.getElementById('awakening-unlock-btn-over');
            const startBtnOver = document.getElementById('awakening-start-btn-over');

            if (isAwakeningUnlocked) {
                // 解放済み
                unlockBtn.classList.add('hidden');
                startBtn.classList.remove('hidden');
                unlockBtnOver.classList.add('hidden');
                startBtnOver.classList.remove('hidden');
            } else {
                // 未解放
                unlockBtn.classList.remove('hidden');
                startBtn.classList.add('hidden');
                unlockBtnOver.classList.remove('hidden');
                startBtnOver.classList.add('hidden');

                // コストが足りているか
                if (mutekiBalls >= AWAKENING_UNLOCK_COST) {
                    unlockBtn.disabled = false;
                    unlockBtnOver.disabled = false;
                    unlockBtn.innerText = `覚醒スタート解放 (無敵 ${AWAKENING_UNLOCK_COST}個消費)`;
                    unlockBtnOver.innerText = `覚醒スタート解放 (無敵 ${AWAKENING_UNLOCK_COST}個消費)`;
                } else {
                    unlockBtn.disabled = true;
                    unlockBtnOver.disabled = true;
                    unlockBtn.innerText = `解放 (無敵 ${AWAKENING_UNLOCK_COST}個必要)`;
                    unlockBtnOver.innerText = `解放 (無敵 ${AWAKENING_UNLOCK_COST}個必要)`;
                }
            }
        }

        function unlockAwakening() {
            if (isAwakeningUnlocked) return; 
            
            if (mutekiBalls >= AWAKENING_UNLOCK_COST) {
                mutekiBalls -= AWAKENING_UNLOCK_COST;
                isAwakeningUnlocked = true;
                
                updateMutekiCountUI();
                updateAwakeningUI();
                saveData(); // 保存
                
                alert(`覚醒スタートを解放しました！\n(無敵ボール ${AWAKENING_UNLOCK_COST}個消費)`);
            } else {
                alert(`無敵ボールが ${AWAKENING_UNLOCK_COST}個 必要です。`);
            }
        }

        function startAwakeningGame() {
            if (!isAwakeningUnlocked) {
                alert("覚醒スタートは解放されていません。");
                return;
            }

            // スタート画面かゲームオーバー画面かを判定して閉じる
            if (!document.getElementById('start-screen').classList.contains('hidden')) {
                startGame(true); // スタート画面から覚醒スタート
            } else if (!document.getElementById('game-over-screen').classList.contains('hidden')) {
                resetGame(true); // ゲームオーバー画面から覚醒スタート
            }
        }
        // ▲▲▲ 追加 ▲▲▲

        // スタート
        init();
