<script lang="ts">
	import { Context } from '$lib/components/Context.svelte';

	const fetchWithToken = Context.fetchWithToken();
	const fetchFriendRequest = Context.fetchFriendRequest();
	const fetchFriends = Context.fetchFriends();
	const fetchMe = Context.fetchMe();
	const addInstance = Context.addInstance();

	let currentRequest: Context.User | null = null;

	async function answerFriendRequest(requestId: number | undefined, response: boolean) {
		if (requestId === undefined) requestId = $friendRequest[0].id;
		await fetchWithToken('notification/friend-response', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ friendId: requestId, response: response })
		});
		fetchFriendRequest();
		fetchFriends();
		fetchMe();
	}

	function checkProfile (userId: number | undefined) {
		if (userId === undefined) userId = $friendRequest[0].id;
		addInstance('Profile', {}, { userId: userId });
	}

	const friendRequest = Context.friendRequest();
	fetchFriendRequest();

</script>

<div id="box">
	{#if $friendRequest?.length === 0}
		<tr>
			<td colspan="3">You don't have any friend request</td>
		</tr>
	{:else}
	<div class="panel">
			<table class="interactive">
				<thead>
					<tr>
						<th>Username</th>
					</tr>
				</thead>
				<tbody>
					{#each $friendRequest as request}
						<tr
								class={currentRequest === request ? 'highlighted' : ''}
								on:click={() => (currentRequest = request)}
							>
							<td>{request.username}</td>
						</tr>
					{/each}
				</tbody>
			</table>
	</div>
		<div class="buttons">
			<button on:click={() => answerFriendRequest(currentRequest?.id, true)}>Accept</button>
			<button on:click={() => answerFriendRequest(currentRequest?.id, false)}>Refuse</button>
			<button on:click={() => checkProfile(currentRequest?.id) }>Check Profile</button>
		</div>
	{/if}
</div>

<style lang="scss">

	#box {
		height: 17rem;
	}

	.buttons {
		width: 13.5rem;
	}

	.panel {
		height: 90%;
		tr > * {
			width: 13.5rem;
		}
	}

	@include table-95;

	button {
		@include button-95;
		padding: 0.3rem 0.6rem;
	}
</style>
