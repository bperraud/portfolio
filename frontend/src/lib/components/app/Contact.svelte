<script lang="ts">
	import { user, socket } from '$lib/stores';
	import { onMount } from 'svelte';
	import type { Socket } from 'socket.io-client';
	import { Context } from '$lib/components/Context.svelte';

	const fetchWithToken = Context.fetchWithToken();
	const fetchFriends = Context.fetchFriends();

	const chats = Context.chats();
	const chatId = Context.chatId();
	const openChatWindow = Context.openChatWindow();
	const contacts = Context.contacts();
	const friendRequest = Context.friendRequest();
	const openFriendRequest = Context.openFriendRequest();
	const friendInfo = Context.friendInfo();

	let groupChatMode = false;
	let selectedFriends: string[] = [];
	let socketInstance: Socket | null = null;

	onMount(() => {
		socket.subscribe(($socket) => {
			socketInstance = $socket;
		});
	});

	async function addFriend(event: Event) {
		const form = (event.target as HTMLFormElement).friend.value;
		const res = await fetchWithToken('users/add-friend', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friend: form })
		});
		await res.json();
		fetchFriends();
	}

	async function openRequest() {
		$openFriendRequest = true;
	}

	async function removeFriend(friendUsername: string) {
		const res = await fetchWithToken('users/remove-friend', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friend: friendUsername })
		});
		await res.json();
		fetchFriends();
	}

	function askGame(friendUsername: string) {
		fetchWithToken('notification/ask-game', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friend: friendUsername })
		});
	}

	function toggleGroupChatMode() {
		groupChatMode = !groupChatMode;
		selectedFriends = [];
	}

	function selectFriend(event: MouseEvent) {
		const friendUsername = (event.target as HTMLInputElement).value;
		const index = selectedFriends.indexOf(friendUsername);
		if (index > -1)
			selectedFriends = [...selectedFriends.slice(0, index), ...selectedFriends.slice(index + 1)];
		else selectedFriends = [...selectedFriends, friendUsername];
	}

	async function createGroupChat() {
		selectedFriends = [$user!.username, ...selectedFriends];
		const groupName = selectedFriends.join(', ');
		let chatid: Number;
		if (socketInstance) {
			socketInstance.emit('createGroupChat', {
				groupName: groupName,
				memberUsernames: selectedFriends,
				isGroupChat: true
			});
			socketInstance.on('createChat', (chatNumber: number) => {
				$chatId = chatNumber;
				$openChatWindow = true;
			});
		}
		toggleGroupChatMode();
	}

	function findChat(user1: string, user2: string) {
		let foundChat;
		chats.subscribe(($chats) => {
			$chats.forEach((chat) => {
				const users = chat.chatUsers.map((chatUser) => chatUser.user.username);
				if (users.includes(user1) && users.includes(user2) && chat.isGroupChat === false) {
					foundChat = chat;
				}
			});
		});
		return foundChat;
	}

	function startChat(friend: Context.Contact) {
		let chat: any;

		if ($user) chat = findChat($user?.username, friend.username);
		$chatId = chat?.id;
		friendInfo.set({ id: friend.id, username: friend.username });
		$openChatWindow = true;
	}

	const addInstance = Context.addInstance();
	const selected = Context.selected();
</script>

<div id="box">
	<form on:submit|preventDefault={addFriend}>
		<label for="friend">Add Friend:</label>
		<input type="text" id="friend" name="friend" />
		<input type="submit" value="+" />
	</form>
	<button on:click={toggleGroupChatMode}>{groupChatMode ? 'Cancel' : 'Create Group Chat'}</button>
	<button on:click={() => openRequest()}>Friend requests</button>
	{#if groupChatMode && selectedFriends.length > 0}
		<button on:click={createGroupChat}>Confirm</button>
	{/if}
	<div id="friend-list">
		{#each $contacts as friend (friend.id)}
			<div class="friend">
				{#if groupChatMode}
					<input
						type="checkbox"
						checked={selectedFriends.includes(friend.username)}
						value={friend.username}
						on:click={selectFriend}
					/>
				{/if}
				<p
					on:dblclick={() => {
						addInstance('Profile', { username: friend.username }, { username: friend.id });
						$selected = null;
					}}
				>
					{friend.username}
				</p>
				<p>{friend.status}</p>
				{#if friend.status === 'online' || friend.status === 'in-game'}
					<button on:click={() => askGame(friend.username)}>Invite Game</button>
				{/if}
				<button on:click={() => startChat(friend)}>Chat</button>
				<button on:click={() => removeFriend(friend.username)}>Remove Friend</button>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	#box {
		width: 15.5rem;
		height: 20rem;
	}

	button,
	input[type='submit'] {
		margin: 0.25rem 0 0rem 0.5rem;
		padding: 0.15rem 0.25rem;
	}

	label {
		margin: 0.5rem;
	}

	#friend {
		background-color: $light-grey;

		&:focus {
			outline: none;
		}
	}
</style>