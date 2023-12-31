<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Context } from '$lib/components/Context.svelte';
	import type { Writable } from 'svelte/store';
	import { user } from '$lib/stores';

	export let show: Map<string, boolean>;

	const fetchWithToken = Context.fetchWithToken();
	const socket = Context.socket();
	const settings = Context.settings();
	const fetchSettings = Context.fetchSettings();
	const soundOn = Context.soundOn();
	const room = Context.room() as Writable<Context.Room>;
	const ping = Context.ping();
	const serverClockDelta = Context.serverClockDelta();
	const fetchUserById = Context.fetchUserById();
	const nPongs = Context.nPongs();

	$nPongs++;

	fetchSettings();

	interface Player {
		id: number;
		name: string;
		elo: number;
	}

	let player1: Player;
	let player2: Player;

	async function getPlayer(id: number): Promise<Player> {
		const u = await fetchUserById(id);
		const res = await fetchWithToken(`stat/get-stat/${id}`);
		const stat = await res.json();
		return {
			id: u.id,
			name: u.username,
			elo: stat.elo
		};
	}

	getPlayer($room.players[0]).then((p) => (player1 = p));
	getPlayer($room.players[1]).then((p) => (player2 = p));

	const index = $room.players.indexOf($user!.id);

	const sounds = {
		paddle: new Audio('/paddle.mp3'),
		wall: new Audio('/wall.mp3'),
		score: new Audio('/score.mp3')
	};

	interface Dimensions {
		readonly width: number;
		readonly height: number;
		readonly ballWidth: number;
		readonly paddleHeight: number;
		readonly paddleWidth: number;
		readonly paddleOffset: number;
		readonly paddleSpeed: number;
	}

	const dimensions: Dimensions = {
		width: 750,
		height: 450,
		ballWidth: 15,
		paddleHeight: 90,
		paddleWidth: 10,
		paddleOffset: 10,
		paddleSpeed: 500
	};

	type Input = {
		clientId: string;
		stateId: number;
		clientTime: number;
		serverTime: number;
		up: boolean;
		down: boolean;
	};

	function update(state: Context.GameState, delta: number): Context.GameState {
		const s = structuredClone(state) as Context.GameState;
		const ball = s.ball;

		ball.x += ball.dx * ball.speed * (delta / 1000);
		ball.y += ball.dy * ball.speed * (delta / 1000);

		const wallLeft = dimensions.paddleWidth + dimensions.paddleOffset;
		const wallRight = dimensions.width - dimensions.paddleWidth - dimensions.paddleOffset;
		if (ball.x <= wallLeft && ball.dx < 0) {
			if (
				!s.missed &&
				ball.y + dimensions.ballWidth >= s.paddles[0].y &&
				ball.y <= s.paddles[0].y + dimensions.paddleHeight
			) {
				if ($soundOn) sounds.paddle.play();
				const dyMax = 0.9;
				const distToCenter =
					ball.y + dimensions.ballWidth / 2 - s.paddles[0].y - dimensions.paddleHeight / 2;
				const dy = dyMax * (distToCenter / (dimensions.paddleHeight / 2));
				ball.dx = 1;
				ball.dy = dy;
				ball.x = wallLeft + (wallLeft - ball.x);
			} else if (ball.x + dimensions.ballWidth < 0) {
				if ($soundOn) sounds.score.play();
				ball.x = dimensions.width / 2 - dimensions.ballWidth / 2;
				ball.y = dimensions.height / 2 - dimensions.ballWidth / 2;
				ball.dx = 1;
				ball.dy = 0;
				s.missed = false;
				s.player2Score++;
			} else {
				s.missed = true;
			}
		} else if (ball.x + dimensions.ballWidth >= wallRight && ball.dx > 0) {
			if (
				!s.missed &&
				ball.y + dimensions.ballWidth >= s.paddles[1].y &&
				ball.y <= s.paddles[1].y + dimensions.paddleHeight
			) {
				if ($soundOn) sounds.paddle.play();
				const dyMax = 0.9;
				const distToCenter =
					ball.y + dimensions.ballWidth / 2 - s.paddles[1].y - dimensions.paddleHeight / 2;
				const dy = dyMax * (distToCenter / (dimensions.paddleHeight / 2));
				ball.dx = -1;
				ball.dy = dy;
				ball.x = wallRight - dimensions.ballWidth - (ball.x + dimensions.ballWidth - wallRight);
			} else if (ball.x > dimensions.width) {
				if ($soundOn) sounds.score.play();
				ball.x = dimensions.width / 2 - dimensions.ballWidth / 2;
				ball.y = dimensions.height / 2 - dimensions.ballWidth / 2;
				ball.dx = -1;
				ball.dy = 0;
				s.missed = false;
				s.player1Score++;
			} else {
				s.missed = true;
			}
		}

		if (ball.y <= 0 && ball.dy < 0) {
			if ($soundOn) sounds.wall.play();
			ball.y = -ball.y;
			ball.dy *= -1;
		} else if (ball.y >= dimensions.height - dimensions.ballWidth && ball.dy > 0) {
			if ($soundOn) sounds.wall.play();
			ball.y =
				dimensions.height -
				dimensions.ballWidth -
				(ball.y - dimensions.height + dimensions.ballWidth);
			ball.dy *= -1;
		}

		s.paddles.forEach((paddle) => {
			if (paddle.up) {
				paddle.y -= dimensions.paddleSpeed * (delta / 1000);
				if (paddle.y < dimensions.paddleOffset) {
					paddle.y = dimensions.paddleOffset;
				}
			}
			if (paddle.down) {
				paddle.y += dimensions.paddleSpeed * (delta / 1000);
				if (paddle.y > dimensions.height - dimensions.paddleHeight - dimensions.paddleOffset) {
					paddle.y = dimensions.height - dimensions.paddleHeight - dimensions.paddleOffset;
				}
			}
		});
		return s;
	}

	const tickRate = 30;
	const delay = 20;
	let inputs = new Array<Input>();
	let up = false;
	let down = false;

	export let scale = 1;

	let animationFrame: number;
	let fps = 0;
	let lastTime = Date.now();
	let accu = 0;
	function draw(ctx: CanvasRenderingContext2D) {
		if (Date.now() - lastTime >= 1000) {
			lastTime = Date.now();
			fps = accu;
			accu = 0;
		}
		accu++;

		const w = dimensions.width * scale;
		const h = dimensions.height * scale;

		const s = update($room.state, Date.now() - $room.state.time);
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = $settings.pong.colors.background;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = $settings.pong.colors.objects;
		ctx.fillRect(
			s.ball.x * scale,
			s.ball.y * scale,
			dimensions.ballWidth * scale,
			dimensions.ballWidth * scale
		);
		ctx.fillRect(
			dimensions.paddleOffset * scale,
			s.paddles[0].y * scale,
			dimensions.paddleWidth * scale,
			dimensions.paddleHeight * scale
		);
		ctx.fillRect(
			w - dimensions.paddleWidth * scale - dimensions.paddleOffset * scale,
			s.paddles[1].y * scale,
			dimensions.paddleWidth * scale,
			dimensions.paddleHeight * scale
		);

		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = $settings.pong.colors.text;
		ctx.beginPath();
		ctx.moveTo(w / 2, 0);
		ctx.lineTo(w / 2, h);
		ctx.stroke();

		ctx.font = `${h / 7}px pong-score`;
		ctx.fillStyle = $settings.pong.colors.text;
		let tw = ctx.measureText(s.player1Score.toString()).width;
		ctx.fillText(s.player1Score.toString(), (w - tw) / 4, h / 5);
		tw = ctx.measureText(s.player2Score.toString()).width;
		ctx.fillText(s.player2Score.toString(), (3 * w - tw) / 4, h / 5);

		if (show.get('names') && player1 && player2) {
			let [p1, p2] = [player1.name, player2.name];
			ctx.font = `${h / 20}px pong-text`;
			if (show.get('rating')) {
				p1 += ` - ${player1.elo}`;
				p2 += ` - ${player2.elo}`;
				ctx.font = `${h / 30}px pong-text`;
			}
			tw = ctx.measureText(p1).width;
			ctx.fillText(p1, w / 4 - tw / 2, h / 1.1);
			tw = ctx.measureText(p2).width;
			ctx.fillText(p2, (3 * w) / 4 - tw / 2, h / 1.1);
		}

		animationFrame = requestAnimationFrame(() => draw(ctx));
	}

	let intervals: number[] = [];
	if (index !== -1) {
		const i = setInterval(() => {
			const input: Input = {
				clientId: $socket.id,
				stateId: $room.state.id + delay,
				clientTime: Date.now() + delay,
				serverTime: Date.now() + delay + $serverClockDelta,
				up,
				down
			};
			$socket.emit('input', input);
			inputs.push(input);
			if (inputs.length > 100) {
				inputs.shift();
			}
		}, 1000 / tickRate);
		intervals.push(i);
	}

	intervals.push(setInterval(() => $socket.emit('ping', Date.now()), 1000));

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		draw(ctx);
	});

	$: if (canvas !== undefined) {
		canvas.width = dimensions.width * scale;
		canvas.height = dimensions.height * scale;
	}

	$socket.on('state', (s: Context.GameState) => {
		s.time -= $serverClockDelta;
		if (index === -1) {
			$room.state = s;
			return;
		}
		while (inputs.length && inputs[0].clientTime < s.time) {
			inputs.shift();
		}
		for (let i = 1; i < inputs.length && inputs[i].clientTime <= Date.now(); i++) {
			s = update(s, inputs[i].clientTime - inputs[i - 1].clientTime);
			s.paddles[index].up = inputs[i].up;
			s.paddles[index].down = inputs[i].down;
			s.time = inputs[i].clientTime;
			s.id = inputs[i].stateId;
		}
		$room.state = s;
	});

	onDestroy(() => {
		$nPongs--;
		if ($nPongs === 0) $socket.off('state');
		intervals.forEach(clearInterval);
		if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === $settings.pong.up) {
			up = true;
		} else if (e.key === $settings.pong.down) {
			down = true;
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.key === $settings.pong.up) {
			up = false;
		} else if (e.key === $settings.pong.down) {
			down = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="container">
	<canvas bind:this={canvas} />
	{#if show.get('performances')}
		<div class="performances">
			<span>
				{$ping} ms
			</span>
			<span>
				{fps} fps
			</span>
		</div>
	{/if}
</div>

<style lang="scss">
	canvas {
		background-color: black;
	}

	div.performances {
		span:not(:last-child) {
			margin-right: 0.3rem;
		}
	}
</style>
