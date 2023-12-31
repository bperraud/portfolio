<script lang="ts" context="module">
	import type { Readable, Writable } from 'svelte/store';
	import { getContext } from 'svelte';

	export namespace Context {
		export const fetchWithToken = (): ((url: string, options?: RequestInit) => Promise<Response>) =>
			getContext('fetchWithToken');

		export const fetchWithTokenNoLogout = (): ((
			url: string,
			options?: RequestInit
		) => Promise<Response>) => getContext('fetchWithTokenNoLogout');

		export type Match = {
			result: string;
			opponent: string;
			createdAt: string;
		};

		export interface Contact {
			id: number;
			username: string;
			status: string;
		}

		export interface Block {
			id: number;
			blockerId: number;
			blockedId: number;
		}

		//export type NotifRequest = {
		//	id: number;
		//	createdAt: string;
		//	senderId: number;
		//	senderName: string;
		//	user: User;
		//	userId: number;
		//};

		export type Chat = {
			chatUsers: ChatUser[];
			messages: Message[];
			createdAt: string;
			id: number;
			isGroupChat: boolean;
			name: string;
			accessibility: string;
			password: string;
			updatedAt: string;
		};

		type ChatUser = {
			chatId: number;
			createdAt: string;
			id: number;
			lastReadMessageId: number | null;
			user: User;
			userId: number;
		};

		export type Message = {
			content : string;
			chatId : number;
			senderId : number;
			senderName : string;
			chatName: string;
			createdAt : Date;
		}

		export type Stat = {
			id: number;
			wins: number;
			losses: number;
			elo: number;
			ladder: string;
		};

		export interface User {
			id: number;
			username: string | null;
		}

		export const contacts = (): Writable<Contact[]> => getContext('contacts');
		export const blocks = (): Writable<Block[]> => getContext('blocks');
		export const friendRequest = (): Writable<User[]> => getContext('friendRequest');
		export const gameRequest = (): Writable<{ id: number; username: string }[]> =>
			getContext('gameRequest');
		export const chats = (): Writable<Chat[]> => getContext('chats');
		export const chatsPublic = (): Writable<Chat[]> => getContext('chatsPublic');
		export const chatId = (): Writable<number | null> => getContext('chatId');
		export const fetchSettings = (): (() => Promise<any>) => getContext('fetchSettings');
		export const unreadConversations = (): Writable<number> => getContext('unreadConversations');
		export const fetchUnreadConversations = (): (() => Promise<number>) =>
			getContext('fetchUnreadConversations');
		export const lastMessages = (): Writable<Message[]> => getContext('lastMessages');
		export interface Settings {
			pong: {
				up: string;
				down: string;
				colors: {
					background: string;
					objects: string;
					text: string;
				};
			};
		}

		export const settings = (): Writable<Settings> => getContext('settings');
		export const soundOn = (): Writable<boolean> => getContext('soundOn');

		export type App =
			| 'Pong'
			| 'Paint'
			| 'Chat'
			| 'ChatForum'
			| 'Contact'
			| 'Profile'
			| 'Conversation'
			| 'Forum'
			| 'FriendRequest'
			| 'Internet'
			| 'Notepad'
			| 'EditProfile'
			| 'PongKeybinds'
			| 'Prompt';

		export interface AppInstance {
			readonly componentType: App;
			readonly component: any;
			visible: boolean;
			readonly propsWin: Record<string, any>;
			readonly props: Record<string, any>;
		}

		export const components = (): Readable<Record<App, any>> => getContext('components');

		interface Props {
			readonly name: string;
			readonly icon: string;
		}

		export interface AppProps {
			readonly TabProps: Props;
			readonly DesktopProps: Props;
		}

		export const apps = (): Readable<Record<App, AppProps>> => getContext('apps');
		export const appInstances = (): Writable<Map<string, AppInstance>> =>
			getContext('appInstances');
		export const selected = (): Writable<string | null> => getContext('selected');
		export const zstack = (): Writable<string[]> => getContext('zstack');

		export const addInstance = (): ((
			componentType: string,
			propsWin?: Record<string, any>,
			props?: Record<string, any>
		) => string) => getContext('addInstance');

		export const removeInstance = (): ((id: string) => void) => getContext('removeInstance');
		export const askGame = (): ((friendId: number) => string) => getContext('askGame');
		export const startChat = (): ((membersId: number[], groupName? :string) => void) => getContext('startChat');
		export const fetchHistory = (): (() => Promise<any>) => getContext('fetchHistory');
		export const fetchMe = (): (() => Promise<any>) => getContext('fetchMe');
		export const fetchUserByUsername = (): ((username: string) => Promise<any>) =>
			getContext('fetchUserByUsername');
		export const fetchUserById = (): ((id: number) => Promise<any>) => getContext('fetchUserById');
		export const fetchUpdateLastMessageRead = (): ((
			chatId: number,
			messageId: number,
			userId: number
		) => Promise<any>) => getContext('fetchUpdateLastMessageRead');
		export const fetchBlockUser = (): ((userId: number) => Promise<any>) =>
			getContext('fetchBlockUser');
		export const fetchFriends = (): (() => Promise<any>) => getContext('fetchFriends');
		export const fetchGetUserBlocks = (): (() => Promise<any>) => getContext('fetchGetUserBlocks');
		export const fetchFriendRequest = (): (() => Promise<any>) => getContext('fetchFriendRequest');
		export const fetchChats = (): (() => Promise<any>) => getContext('fetchChats');
		export const fetchChatById = (): ((chatId: number) => Promise<any>) =>
			getContext('fetchChatById');

		export const fetchPublicChats = (): ((start: number, limit: number) => Promise<any>) =>
			getContext('fetchPublicChats');
		export const fetchVerifyPassword = (): ((chatId: number, password: string) => Promise<any>) =>
			getContext('fetchVerifyPassword');

		export const socket = (): Readable<Socket> => getContext('socket');

		export const getUnreadMessagesCount = (): ((chat: any, chatUser: any) => number) =>
			getContext('getUnreadMessagesCount');

		export const ping = (): Writable<number> => getContext('ping');
		export const serverClockDelta = (): Writable<number> => getContext('serverClockDelta');

		// -------- PONG ---------

		interface Ball {
			x: number;
			y: number;
			dx: number;
			dy: number;
			speed: number; //pixel per second
		}

		type Paddle = {
			y: number;
			up: boolean;
			down: boolean;
		};

		export interface GameState {
			ball: Ball;
			paddles: [Paddle, Paddle];
			time: number;
			id: number;
			inputed: boolean;
			lastInputId: number;
			missed: boolean;
			player1Score: number;
			player2Score: number;
		}

		export interface Room {
			room: string;
			players: [number, number];
			state: GameState;
		}

		export const matchmaking = (): Writable<boolean> => getContext('matchmaking');
		export const nPongs = (): Writable<number> => getContext('nPongs');
		export const room = (): Writable<Room | null> => getContext('room');
		export const outcome = (): Writable<'win' | 'lose' | null> => getContext('outcome');
		export const updateStat = (): Writable<number> => getContext('updateStat');

	}
</script>

<script lang="ts">
	import { writable, readable } from 'svelte/store';
	import { setContext } from 'svelte';
	import Pong from '$lib/components/app/pong/Pong.svelte';
	import Paint from '$lib/components/app/Paint.svelte';
	import Chat from '$lib/components/app/Chat.svelte';
	import ChatForum from '$lib/components/app/ChatForum.svelte';
	import Contact from '$lib/components/app/Contact.svelte';
	import Profile from '$lib/components/app/profile/Profile.svelte';
	import Forum from '$lib/components/app/Forum.svelte';
	import Conversation from '$lib/components/app/Conversation.svelte';
	import Internet from '$lib/components/app/Internet.svelte';
	import Notepad from '$lib/components/app/Notepad.svelte';
	import Prompt from '$lib/components/app/Prompt.svelte';
	import FriendRequest from '$lib/components/app/FriendRequest.svelte';
	import EditProfile from '$lib/components/app/EditProfile.svelte';
	import PongKeybinds from '$lib/components/app/pong/PongKeybinds.svelte';
	import { token, user, loading } from '$lib/stores';
	import { PUBLIC_BACKEND_URL, PUBLIC_WEBSERV_URL } from '$env/static/public';
	import type { Socket } from 'socket.io-client';
	import ioClient from 'socket.io-client';
	import { onDestroy } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';
	import { logout } from '$lib/utils/connect';

	let intervals: number[] = [];

	function fetchWithToken(route: string, options: RequestInit = {}): Promise<Response> {
		$loading = true;
		const res = fetch(`${PUBLIC_BACKEND_URL}/${route}`, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${$token}`
			}
		});
		res.then((resp) => {
			$loading = false;
			if (resp.status === 401) logout();
		});
		return res;
	}

	function fetchWithTokenNoLogout(route: string, options: RequestInit = {}): Promise<Response> {
		const res = fetch(`${PUBLIC_BACKEND_URL}/${route}`, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${$token}`
			}
		});
		return res;
	}

	setContext('fetchWithToken', fetchWithToken);
	setContext('fetchWithTokenNoLogout', fetchWithTokenNoLogout);

	const contacts = writable<Context.Contact[]>([]);
	const blocks = writable<Context.Block[]>([]);
	const friendRequest = writable<Context.User[]>([]);
	const gameRequest = writable<{ id: number; username: string }[]>([]);
	const unreadConversations = writable(0);
	const chats = writable<Context.Chat[]>([]);
	const chatsPublic = writable<Context.Chat[]>([]);
	const chatId = writable<number | null>(null);
	const lastMessages = writable<Context.Message[]>([]);
	const updateStat = writable(0);

	setContext('updateStat', updateStat);
	setContext('contacts', contacts);
	setContext('blocks', blocks);
	setContext('friendRequest', friendRequest);
	setContext('gameRequest', gameRequest);
	setContext('unreadConversations', unreadConversations);
	setContext('chats', chats);
	setContext('chatsPublic', chatsPublic);
	setContext('chatId', chatId);
	setContext('lastMessages', lastMessages);

	const settings = writable<Context.Settings>({
		pong: {
			up: 'ArrowUp',
			down: 'ArrowDown',
			colors: {
				background: '#000000',
				objects: '#ffffff',
				text: '#ffffff'
			}
		}
	});
	const soundOn = writable(true);

	setContext('settings', settings);
	setContext('soundOn', soundOn);

	async function fetchSettings() {
		const res = await fetchWithToken('settings/get-settings');
		const data = await res.json();
		$settings.pong.up = data.up;
		$settings.pong.down = data.down;
		$settings.pong.colors.background = data.backgroundColor;
		$settings.pong.colors.objects = data.objectsColor;
		$settings.pong.colors.text = data.textColor;
		return data;
	}

	setContext('fetchSettings', fetchSettings);

	const components = readable({
		Pong: Pong,
		Paint: Paint,
		Chat: Chat,
		ChatForum: ChatForum,
		FriendRequest: FriendRequest,
		Contact: Contact,
		Profile: Profile,
		Conversation: Conversation,
		Forum: Forum,
		Internet: Internet,
		Notepad: Notepad,
		EditProfile: EditProfile,
		Prompt: Prompt,
		PongKeybinds: PongKeybinds
	});

	const appInstances = writable(new Map<string, Context.AppInstance>());
	const zstack = writable<string[]>([]);
	const selected = writable<string | null>(null);

	function addInstance(
		componentType: string,
		propsWin: Record<string, any> = {},
		props: Record<string, any> = {}
	) {
		const id = uuidv4();
		$zstack = [...$zstack, id];
		$appInstances.set(id, {
			componentType: componentType as Context.App,
			component: $components[componentType as Context.App],
			visible: true,
			propsWin: { ...propsWin, appId: id },
			props
		});
		$appInstances = $appInstances;
		return id;
	}

	function removeInstance(id: string) {
		$appInstances.delete(id);
		$appInstances = $appInstances;
		$zstack = $zstack.filter((z) => z !== id);
	}

	setContext('components', components);
	setContext('appInstances', appInstances);
	setContext('zstack', zstack);
	setContext('selected', selected);
	setContext('addInstance', addInstance);
	setContext('removeInstance', removeInstance);
	setContext('askGame', askGame);
	setContext('startChat', startChat);

	const apps = readable<Record<Context.App, Context.AppProps>>({
		Profile: {
			TabProps: { name: 'Profile', icon: '/computer.png' },
			DesktopProps: { name: 'Profile', icon: '/computer.png' }
		},
		Conversation: {
			TabProps: { name: 'Conversation', icon: '/mail3.png' },
			DesktopProps: { name: 'Conversation', icon: '/big-mail.png' }
		},
		Chat: {
			TabProps: { name: 'Chat', icon: '/mail3.png' },
			DesktopProps: { name: 'Chat', icon: '/big-mail.png' }
		},
		ChatForum: {
			TabProps: { name: 'ChatForum', icon: '/mail3.png' },
			DesktopProps: { name: 'ChatForum', icon: '/big-mail.png' }
		},
		Contact: {
			TabProps: { name: 'Contact', icon: '/phone.png' },
			DesktopProps: { name: 'Contact', icon: '/phone.png' }
		},
		Pong: {
			TabProps: { name: 'Pong', icon: '/pong.png' },
			DesktopProps: { name: 'Pong', icon: '/big-pong.png' }
		},
		FriendRequest: {
			TabProps: { name: 'FriendRequest', icon: '/computer.png' },
			DesktopProps: { name: 'FriendRequest', icon: '/computer.png' }
		},
		Forum: {
			TabProps: { name: 'Forum', icon: '/msn.png' },
			DesktopProps: { name: 'Forum', icon: '/msn.png' }
		},
		Paint: {
			TabProps: { name: 'Paint', icon: '/paint.png' },
			DesktopProps: { name: 'Paint', icon: '/paint.png' }
		},
		Internet: {
			TabProps: { name: 'Internet', icon: '/internet.png' },
			DesktopProps: { name: 'Internet', icon: '/internet.png' }
		},
		Notepad: {
			TabProps: { name: 'Notepad', icon: '/notepad.png' },
			DesktopProps: { name: 'Notepad', icon: '/notepad.png' }
		},
		EditProfile: {
			TabProps: { name: 'EditProfile', icon: '/computer.png' },
			DesktopProps: { name: 'EditProfile', icon: '/computer.png' }
		},
		Prompt : {
			TabProps: { name: 'MS-DOS Prompt', icon: '/shell.png' },
			DesktopProps: { name: 'Prompt', icon: '/shell.png' }

		},
		PongKeybinds: {
			TabProps: { name: 'Keybinds', icon: '/computer.png' },
			DesktopProps: { name: 'Keybinds', icon: '/computer.png' }
		}
	});

	setContext('apps', apps);

	async function fetchMe() {
		const res = await fetchWithToken('users/me');
		const data = await res.json();
		$user = {
			id: data.id,
			username: data.username,
			login: data.login,
			twoFactorEnabled: data.twoFactorEnabled,
			logFrom42: data.logFrom42,
			createdAt: data.createdAt,
			friends: data.friends
		};
		return data;
	}

	async function fetchUnreadConversations() {
		$unreadConversations = 0;
		for (const chat of $chats) {
			if (
				getUnreadMessagesCount(
					chat,
					chat.chatUsers.find((chatUser) => chatUser.userId === $user?.id)
				) > 0 &&
				chat.accessibility === 'private'
			) {
				$unreadConversations++;
			}
		}
	}

	async function fetchUserByUsername(username: string) {
		const res = await fetchWithToken(`users/info/name/${username}`);
		const data = await res.json();
		return data;
	}

	function askGame(friendId: number) {
		fetchWithToken('notification/ask-game', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friendId: friendId })
		});
	}

	//function findChat(user1: string, user2: string) {
	//	let foundChat;

	//	$chats.forEach((chat) => {
	//		const users = chat.chatUsers.map((chatUser) => chatUser.user.username);
	//		if (users.includes(user1) && users.includes(user2) && chat.isGroupChat === false) {
	//			foundChat = chat;
	//		}
	//	});
	//	return foundChat;
	//}

	async function getChatId(membersId: number[]) : Promise<number> {
		const membersIdString = membersId.join(',');
		const res = await fetchWithToken(`chat/chatId?ids=${membersIdString}`);
		const data = await res.json();
		return data.chatId;
	}

	async function startChat(membersId: number[], groupName? : string) {
		let chatId : number = await getChatId(membersId);
		if (chatId == -1) {
  			const res = await fetchWithToken('chat/create-chat', {
				method: 'POST',
				headers: {
						'Content-Type': 'application/json'
			},
				body: JSON.stringify({
					membersId : membersId,
					accessibility: 'PRIVATE',
					name: groupName
				})
			});
			const data = await res.json();
			chatId = data.chatId;
		}
		addInstance('Chat', {}, { chatId: chatId });
	}

	async function fetchUserById(id: number) {
		const res = await fetchWithToken(`users/info/${id}`);
		const data = await res.json();
		return data;
	}

	async function fetchFriends() {
		const res = await fetchWithToken('friend/me');
		const data = await res.json();
		$contacts = data;
		return data;
	}

	async function fetchGetUserBlocks() {
		const res = await fetchWithToken('users/me/blocks');
		const data = await res.json();
		$blocks = data;
		return data;
	}

	async function fetchFriendRequest() {
		const res = await fetchWithToken('notification/get?type=FRIEND');
		const data = await res.json();
		$friendRequest = data;
		return data;
	}

	async function fetchChats() {
		const res = await fetchWithToken('chat/lastConversationMessages');
		const data = await res.json();
		$lastMessages = data;
		await fetchUnreadConversations();
		return data;
	}

	async function fetchPublicChats(start: number, limit: number) {
		const response = await fetchWithToken(`chat/publicChats?start=${start}&limit=${limit}`);
		const data = await response.json();
		$chatsPublic = data.chats;
		return data;
	}

	async function fetchUpdateLastMessageRead(
		chatId: number,
		messageId: number,
		userId: number | undefined
	) {
		const response = await fetchWithToken(`chat/updateLastMessageRead`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ chatId, messageId, userId })
		});
		const data = await response.json();
		if (data) {
			$chats = $chats.map((chat) => {
				if (chat.id === chatId) {
					return {
						...chat,
						chatUsers: chat.chatUsers.map((chatUser) =>
							chatUser.userId === userId ? { ...chatUser, lastReadMessageId: messageId } : chatUser
						)
					};
				} else {
					return chat;
				}
			});
		}
		await fetchUnreadConversations();
		return data;
	}

	async function fetchVerifyPassword(chatId: number, password: string) {
		const response = await fetchWithToken('chat/verifyPassword', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				chatId,
				password
			})
		});

		const data = await response.json();
		return data;
	}

	setContext('fetchPublicChats', fetchPublicChats);
	setContext('fetchMe', fetchMe);
	setContext('fetchUserByUsername', fetchUserByUsername);
	setContext('fetchUserById', fetchUserById);
	setContext('fetchUpdateLastMessageRead', fetchUpdateLastMessageRead);
	setContext('fetchFriends', fetchFriends);
	setContext('fetchGetUserBlocks', fetchGetUserBlocks);
	setContext('fetchFriendRequest', fetchFriendRequest);
	setContext('fetchChats', fetchChats);
	setContext('fetchVerifyPassword', fetchVerifyPassword);
	setContext('fetchUnreadConversations', fetchUnreadConversations);

	const socket = readable<Socket>(
		ioClient(PUBLIC_BACKEND_URL, {
			query: {
				token: $token
			}
		})
	);

	const ping = writable(0);
	const serverClockDelta = writable(0);

	setContext('ping', ping);
	setContext('serverClockDelta', serverClockDelta);

	const matchmaking = writable(false);
	const nPongs = writable(0);
	const room = writable<Context.Room | null>(null);
	const outcome = writable<'win' | 'lose' | null>(null);

	setContext('room', room);
	setContext('nPongs', nPongs);
	setContext('matchmaking', matchmaking);
	setContext('outcome', outcome);

	$: if ($matchmaking) {
		fetchWithToken('matchmaking/queue', {
			method: 'POST'
		});
	}

	$: if (!$matchmaking) {
		fetchWithToken('matchmaking/unqueue', {
			method: 'POST'
		});
	}

	// ------- EVENTS --------

	$socket.on('disconnect', logout);

	intervals.push(setInterval(() => $socket.emit('ping', Date.now()), 1000));

	$socket.on('ping', (data: [number, number]) => {
		$ping = Date.now() - data[0];
		$serverClockDelta = data[1] - Date.now() + $ping / 2;
	});

	$socket.on('FRIEND', (data: { message: string }) => {
		fetchFriendRequest();
		fetchFriends();
		fetchMe();
	});

	$socket.on('game', (data: { id: number; username: string }) => {
		$gameRequest = [...$gameRequest, { ...data }];
	});

	$socket.on('enter-room', (data: { room: string; players: [number, number] }) => {
		$matchmaking = false;
		$gameRequest = [];
		$room = {
			room: data.room,
			players: data.players,
			state: {
				ball: {
					x: 0,
					y: 0,
					dx: 0,
					dy: 0,
					speed: 0
				},
				paddles: [
					{
						y: 0,
						up: false,
						down: false
					},
					{
						y: 0,
						up: false,
						down: false
					}
				],
				time: 0,
				id: 0,
				inputed: false,
				lastInputId: 0,
				missed: false,
				player1Score: 0,
				player2Score: 0
			}
		};
		$socket.emit('enter-room');
	});

	$socket.on('game-over', (data: { winnerId: number }) => {
		$matchmaking = false;
		$outcome = data.winnerId === $room!.players.indexOf($user!.id) ? 'win' : 'lose';
		updateStat.set($updateStat + 1);
		$room = null;
	});

	$socket.on('addChat', (chat) => {
		chats.update((chatsValue) => [...chatsValue, chat]);
	});

	//$socket.on('leaveChat', (chatId) => {
	//	$chats = $chats.filter((chat) => chat.id !== chatId);
	//});

	$socket.on('updateChatName', ({ chatId, newName }) => {
		let targetChatIndex = $chats.findIndex((chat) => chat.id === chatId);
		if (targetChatIndex !== -1) {
			let chatscopy = [...$chats];
			chatscopy[targetChatIndex].name = newName;
			$chats = chatscopy;
		} else {
			console.error(`Received message for unknown chat with id: ${chatId}`);
		}
	});



	$socket.on('updateStatus', (data) => {
		const { friendId, status } = data;
		for (let i = 0; i < $contacts.length; i++) {
			if ($contacts[i].id === friendId) {
				$contacts[i].status = status;
				break;
			}
		}
	});

	// ------- END EVENTS --------

	setContext('socket', socket);

	onDestroy(() => {
		$socket.disconnect();
	});

	function getUnreadMessagesCount(chat: any, chatUser: any) {
		if (chat.messages.length > 0) {
			const lastReadMessageId = chatUser ? chatUser.lastReadMessageId || 0 : 0;
			const unreadMessages = chat.messages.filter((message: any) => message.id > lastReadMessageId);
			const unreadCount = unreadMessages.length;

			return unreadCount > 99 ? '99+' : unreadCount;
		} else {
			return 0;
		}
	}

	setContext('getUnreadMessagesCount', getUnreadMessagesCount);

	onDestroy(() => {
		intervals.forEach(clearInterval);
	});
</script>

<slot />
