<script lang="ts">
	import { Context } from '$lib/components/Context.svelte';
	import { user } from '$lib/stores';
	import ErrorDialog from '$lib/components/dialog/ErrorDialog.svelte';
	import TwoFactorDialog from '$lib/components/app/profile/TwoFactorDialog.svelte';

	const fetchWithToken = Context.fetchWithToken();
	const addInstance = Context.addInstance();
	const fetchMe = Context.fetchMe();

	let showModal = false;
	let showDialog = false;
	let errorMessage: string | null = null;
	let internetWindow: string;

	let changes = false;
	let inputLogin = $user?.login;
	let inputUsername = $user?.username;
	let checkboxValue = $user?.twoFactorEnabled;

	async function handleSubmit(event: Event) {
		const form = event.target as HTMLFormElement;
		const data: Record<string, any> = {};
		if (!checkboxValue) data['twoFactorEnabled'] = checkboxValue;
		for (const element of form.elements) {
			if (element instanceof HTMLInputElement && element.name && element.type !== 'checkbox') {
				data[element.name] = element.value;
			}
		}
		const res = await fetchWithToken('users/edit', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});
		const json = await res.json();
		if (res.status !== 200 && res.status !== 201) {
			errorMessage = json.message;
			showModal = true;
		} else {
			changes = false;
			if (!$user?.twoFactorEnabled && checkboxValue) generate2fa();
			await fetchMe();
		}
	}

	async function generate2fa() {
		const res = await fetchWithToken('2fa/generate', {
			method: 'POST'
		});
		const data = await res.json();
		internetWindow = addInstance('Internet', {}, { url: data.qrcode });
		showDialog = true;
	}

	function handleChange() {
		changes =
			inputLogin !== $user?.login ||
			inputUsername !== $user?.username ||
			checkboxValue !== $user?.twoFactorEnabled;
	}

	let fileinput: HTMLInputElement;
	let imgUrl: string | '';

	const onFileSelected = (e: any) => {
		let image = e.target.files[0];
		const formData = new FormData();
		formData.append('file', image);

		fetchWithToken('users/upload', {
			method: 'POST',
			body: formData
		})
			.then((res) => res.json())
			.then((data) => {
				imgUrl = URL.createObjectURL(image);
			});
		changes = true;
	};

	export let username: string | null | undefined = null;
	let login: string | null | undefined = null;
	let currentUser: any = {};

	if (username === null) {
		username = $user!.username;
		login = $user!.login;
		currentUser = $user;
	} else {
		fetchWithToken(`users/info/${$user?.id}`)
			.then((res) => res.json())
			.then((data) => {
				currentUser = data;
				login = currentUser.login;
			});
	}

	if (login) {
		fetchWithToken(`users/avatar/${$user?.id}`)
			.then((res) => {
				if (res.status === 200 || res.status === 201) {
					return res.blob()
					.then((blob) => {
						imgUrl = URL.createObjectURL(blob);
					});
				} else {
					imgUrl = '/avatar.png';
				}
			})
	}

</script>

<div class="window-body">
	<TwoFactorDialog {showDialog} {internetWindow} on:close={() => (showDialog = false)} />
	<ErrorDialog {showModal} {errorMessage} on:close={() => (showModal = false)} />
	<div id="formular">
		<div class="pic-username-login">
			<li class="pic">
				<input
					type="file"
					id="file-upload"
					accept=".jpg, .jpeg, .png"
					on:change={(e) => onFileSelected(e)}
					bind:this={fileinput}
					autocomplete="off"
				/>
				<img src={imgUrl} />
			</li>
		</div>
		<div class="content">
			<form
				on:submit|preventDefault={handleSubmit}
				method="post"
				enctype="application/x-www-form-urlencoded"
			>
				<div class="form-group">
					<label for="username">Username:</label>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={inputUsername}
						on:input={handleChange}
						autocomplete="off"
					/>
				</div>
				{#if !$user?.logFrom42}
					<div class="form-group">
						<label for="login">Login:</label>
						<input
							type="text"
							id="login"
							name="login"
							bind:value={inputLogin}
							on:input={handleChange}
							autocomplete="off"
						/>
					</div>
					<input
						type="checkbox"
						id="twoFactorEnabled"
						bind:checked={checkboxValue}
						on:change={handleChange}
					/>
					<label for="twoFactorEnabled">2fa</label>
				{/if}
				{#if changes}
					<button type="submit">Save</button>
				{:else}
					<button disabled type="submit">Save</button>
				{/if}
			</form>
		</div>
	</div>
</div>

<style lang="scss">
	div#formular {
		@include checkbox;
		@include form-95;
		@include tab-border($dark-grey, $light-grey);

		padding: 0.2rem;
		background-color: $grey;

		form {
			@include tab-border($light-grey, $dark-grey);
			display: flex;
			flex-direction: column;
			gap: 0.8rem;
			padding: 1rem;
			width: 18rem;
			margin-top: 0.2rem;
			label {
				color: black;
				width: 7rem;
			}
		}

		input {
			width: 100%;
		}

		.form-group {
			display: flex;
			align-items: center;
		}

		button {
			@include tab-contour;
			@include tab-contour-active;
			width: 4rem;
			height: 1.5rem;
			font-size: 1rem;
			align-self: center;
		}

		.pic {
				@include tab-contour-hollow;
				background-color: white;
				display: flex;
				justify-content: center;
				align-items: center;
				width: 7.1rem;
				margin-left: auto;
				margin-right: auto;
				overflow: hidden;

				img {
					position: center;
					height: 5rem;
				}

				input[type='file'] {
					position: absolute;
					height: 5rem;
					width: 7.1rem;
					margin-left: auto;
					margin-right: auto;
					opacity: 0;
					cursor: pointer;
			}
		}
	}
</style>
