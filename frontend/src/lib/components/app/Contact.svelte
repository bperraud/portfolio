<script lang="ts">
	import { user } from '$lib/stores';
	import { Context } from '$lib/components/Context.svelte';
	import NotificationBadge from '../NotificationBadge.svelte';
	import ErrorDialog from '$lib/components/dialog/ErrorDialog.svelte';

	const socket = Context.socket();
	const fetchWithToken = Context.fetchWithToken();
	const fetchFriends = Context.fetchFriends();
	const fetchMe = Context.fetchMe();
	const contacts = Context.contacts();
	const friendRequest = Context.friendRequest();
	const addInstance = Context.addInstance();
	const selected = Context.selected();
	const askGame = Context.askGame();
	const startChat = Context.startChat();

	let selectedFriends: Context.Contact[] = [];
	let friendInput: string = '';
	let groupChatMode = false;
	let errorMessage: string | null = null;
	let showModal = false;

	fetchFriends();

	async function addFriend(event: Event) {
		const form = (event.target as HTMLFormElement).friend.value;
		const res = await fetchWithToken('notification/add-friend', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friend: form })
		});
		const json = await res.json();
		if (res.status !== 200 && res.status !== 201) {
			errorMessage = json.message;
			showModal = true;
		}
		friendInput = '';
	}

	async function removeFriend(friendId: number) {
		await fetchWithToken(`friend/remove/${friendId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		fetchFriends();
		fetchMe();
	}

	function toggleGroupChatMode() {
		groupChatMode = !groupChatMode;
		selectedFriends = [];
	}

	function selectFriend(friend: Context.Contact) {
		const friendUsername = friend.username;
		const index = selectedFriends.findIndex((f : Context.Contact) => f.username === friendUsername);
		if (index > -1)
			selectedFriends = [...selectedFriends.slice(0, index), ...selectedFriends.slice(index + 1)];
		else selectedFriends = [...selectedFriends, friend];
	}

	async function createGroupChat() {
		const memberUsernames = selectedFriends.map(friend => friend.username);
		const ids = selectedFriends.map(item => item.id);
		memberUsernames.push($user?.username);
		startChat(ids, memberUsernames.join(', '));
		toggleGroupChatMode();
	}

	let visible: number = 0;

	function spectateGame(friendId: number) {
		$socket.emit('spectate', { friendId: friendId });
		addInstance('Pong');
	}
</script>

<svelte:window on:mousedown={() => (visible = 0)} />

<div class="box" on:mousedown={() => (visible = 0)}>
	<ErrorDialog {showModal} {errorMessage} on:close={() => (showModal = false)} />
	<form on:submit|preventDefault={addFriend} class="add-friend-form">
		<input type="text" name="friend" bind:value={friendInput} placeholder=" Search..." autocomplete="off"/>
		<input type="submit" value="Add friend" />
	</form>
	<div class="friend-list">
		{#each $contacts as friend (friend.id)}
			<div class="friend">
				{#if groupChatMode}
					<input
						type="checkbox"
						checked={selectedFriends.includes(friend)}
						value={friend.username}
						on:click={() => selectFriend(friend)}
						autocomplete="off"
					/>
				{/if}
				<div class="name-options">
					<p
						class="username"
						on:mousedown|stopPropagation={() => {
							visible = visible === friend.id ? 0 : friend.id;
						}}
					>
						{friend.username}
						{#if visible === friend.id}
							▴
						{:else}
							▾
						{/if}
					</p>
					<div
						class="buttons"
						on:mousedown|stopPropagation={() => {
							visible = visible;
						}}
					>
						{#if visible === friend.id}
							<img
								class="option-icons"
								src="/profile2.png"
								on:click={() => {
									addInstance('Profile', {userId: friend.id}, {userId: friend.id});
									$selected = null;
								}}
							/>
							{#if friend.status !== 'offline'}
								<img
									class="option-icons"
									src="/joystick.png"
									on:click={() => askGame(friend.id)}
								/>
							{/if}
							<img class="option-icons" src="/write.png" on:click={() => startChat([friend.id])} />
							{#if friend.status === 'in-game'}
								<img
									class="option-icons"
									src="/camera.png"
									on:click={() => spectateGame(friend.id)}
								/>
							{/if}
						{/if}
					</div>
				</div>
				<div class="status-img">
					<p class="status">{friend.status}</p>
					{#if friend.status === 'online'}
						<img src="/online.png" alt="online" />
					{:else if friend.username === 'vrogiste' && friend.status === 'in-game'}
						<img src="/in-game-val.png" alt="in-game" />
					{:else if friend.status === 'in-game'}
						<img src="/in-game.png" alt="in-game" />
					{:else if friend.status === 'spectator'}
						<img src="/spectator.png" alt="spectator" />
					{:else}
						<img src="/offline.png" alt="offline" />
					{/if}
					<img
						class="remove-icon"
						src="/red-cross.png"
						on:click={() => removeFriend(friend.id)}
					/>
				</div>

			</div>
		{/each}
	</div>
	<div class="centered-buttons">
		<button on:click={toggleGroupChatMode}>{groupChatMode ? 'Cancel' : 'Create Group Chat'}</button>
		{#if groupChatMode && selectedFriends.length > 0}
			<button on:click={createGroupChat}>Confirm</button>
		{/if}
		<span class="notification-badge">
			<NotificationBadge count={$friendRequest.length} />
		</span>
		<button on:click={() => addInstance('FriendRequest')}>Friend requests</button>
	</div>
</div>

<style lang="scss">
	.notification-badge {
		position: relative;
		top: 1.6rem;
		left: 9.3rem;
	}

	.box {
		display: flex;
		flex-direction: column;
		width: 15rem;
		height: 20rem;
		.centered-buttons {
			margin: 0.4rem 0;
			display: flex;
		}
		.add-friend-form {
			display: flex;
			justify-content: center;
			width: 100%;

			label {
				width: 100%;
				display: block;
			}
			input[type='text'] {
				@include input-text;
				width: 100%;
			}
			input[type='submit'] {
				@include input-submit;
				@include button-95;
			}
		}
	}
	.friend-list {
		flex-grow: 2;
		@include tab-border($light-grey, $dark-grey);
		margin: 0.25rem;
		.friend {
			display: flex;
			justify-content: space-between;
			white-space: nowrap;
			padding: 0.25rem;
			.status-img {
				margin-bottom: auto;
				display: flex;
				align-items: center;

				.status {
					margin-left: auto;
				}
				img {
					height: 0.9rem;
					padding-left: 0.5rem;
				}

				.remove-icon {
					padding-left: 0.4rem;
					height: 0.7rem;
					cursor: url($click), auto;
				}
			}
			.option-icons {
				margin: 0.15rem;
				height: 1.3rem;
				cursor: url($click), auto;
			}
			.username {
				margin: 0 0.25rem;
				cursor: url($click), auto;
			}
		}

		.buttons {
			display: flex;
			align-items: right;
		}
	}
	button {
		@include button-95;

		padding: 0.3rem 0.625rem;
		margin: 0 0.25rem;
		width: 100%;
		white-space: nowrap;
	}
</style>
