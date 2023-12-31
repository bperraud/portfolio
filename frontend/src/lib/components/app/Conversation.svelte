<script lang="ts">
	import { writable } from 'svelte/store';
	import { onDestroy } from 'svelte';
	import { user } from '$lib/stores';
	import { Context } from '$lib/components/Context.svelte';
	import NotificationBadge from '$lib/components/NotificationBadge.svelte';

	const lastMessages = Context.lastMessages();
	const addInstance = Context.addInstance();
	const blocks = Context.blocks();
	const fetchChats = Context.fetchChats();
	const getUnreadMessagesCount = Context.getUnreadMessagesCount();
	let now = new Date();
	let blockedIds = writable<number[]>([]);

	const intervalId = setInterval(() => {
		now = new Date();
	}, 30000);

	$: {
		blockedIds.set($blocks.map((block) => block.blockedId));
		fetchChats();
	}

	onDestroy(() => {
		clearInterval(intervalId);
	});

	function timeDifference(current: Date, previous: Date) {
		const msPerMinute = 60 * 1000;
		const msPerHour = msPerMinute * 60;
		const msPerDay = msPerHour * 24;
		const msPerMonth = msPerDay * 30;
		const msPerYear = msPerDay * 365;

		const elapsed = current.getTime() - previous.getTime();
		if (elapsed <= 0) return 'just now';
		else if (elapsed < msPerMinute) return Math.round(elapsed / 1000) + ' s ago';
		else if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' min ago';
		else if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' h ago';
		else if (elapsed < msPerMonth) return Math.round(elapsed / msPerDay) + ' d ago';
		else if (elapsed < msPerYear) return Math.round(elapsed / msPerMonth) + ' m ago';
		else return Math.round(elapsed / msPerYear) + ' y ago';
	}
</script>

<div id="box">
	<div id="chat-window">
		{#each $lastMessages as conversation, i (i)}
			<div class="chat" on:click={() => addInstance('Chat', {}, { chatId: conversation.chatId })}>
				<div class="chat-header">
					<h4>{conversation.chatName}</h4>
				</div>
				<div class="chat-content">
					{#if $lastMessages.length > 0}
						<div class="message-details">
							<p>
								<!--{#if !$blockedIds.includes(getFriendId(chat))}
								{chat.messages[chat.messages.length - 1].userId === $user?.id
									? 'you'
									: getLastMessageSender(chat)}
								: { chat.messages[chat.messages.length - 1].content }
							{:else}
								{ 'blocked' }
							{/if}-->
								{conversation.senderId === $user?.id ? 'you' : conversation.senderName} : { conversation.content}
							</p>
							<span class="timestamp"
								>{timeDifference(
									now,
									new Date(conversation.createdAt)
								)}</span
							>
						</div>
						<p class="notification-badge">
								<!--<NotificationBadge count={getUnreadMessagesCount(conversation.chatId)} />-->
						</p>
					{:else}
						<p>No messages yet</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	#box {
		width: 20rem;
	}

	#chat-window {
		height: 22rem;
		overflow-y: auto;
		overflow-x: hidden;
		margin: 0.2rem;
		padding: 0.3rem;
	}

	.chat {
		@include tab-border($light-grey, $dark-grey);
		padding: 0.5rem;
		margin-bottom: 0.2rem;
	}

	h4 {
		color: $blue;
		margin-bottom: 0.2rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 12rem;
		h5 {
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 15rem;
		}
	}

	.chat-content {
		position: relative;
		display: flex;
		justify-content: space-between;
	}

	.message-details p {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 8.6rem;
		margin-bottom: 0.2rem;
	}

	.chat-content {
		position: relative;
		display: flex;
		justify-content: space-between;
	}

	.notification-badge {
		margin-top: 1rem;
	}

	.timestamp {
		font-size: 0.8rem;
		color: $dark-grey;
	}
</style>
