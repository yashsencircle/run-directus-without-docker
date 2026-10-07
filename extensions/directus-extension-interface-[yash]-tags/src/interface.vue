<template>
	<div class="tag-input">
		<div class="chips">
			<span v-if="tags.length === 0" class="placeholder">No tags yet</span>
			<span v-for="(tag, index) in tags" :key="`${tag}-${index}`" class="chip">
				{{ tag }}
				<button
					type="button"
					class="chip-remove"
					:aria-label="`Remove ${tag}`"
					@click="removeTag(index)"
				>
					×
				</button>
			</span>
		</div>

		<input
			v-model="draft"
			class="tag-field"
			type="text"
			:placeholder="placeholderText"
			@keydown.enter.prevent="addTag"
			@keydown.delete.exact="onBackspace"
		/>
	</div>
</template>

<script>
export default {
	props: {
		value: {
			type: [Array, String],
			default: null,
		},
		placeholder: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	data() {
		return {
			draft: '',
		};
	},
	computed: {
		tags() {
			return parseTags(this.value);
		},
		placeholderText() {
			return this.placeholder || 'Type a tag and press Enter...';
		},
	},
	methods: {
		addTag() {
			const candidates = this.draft
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			if (candidates.length === 0) return;

			const next = [...this.tags];

			for (const tag of candidates) {
				if (!next.includes(tag)) next.push(tag);
			}

			this.draft = '';
			this.emitValue(next);
		},
		removeTag(index) {
			const next = this.tags.filter((_, i) => i !== index);
			this.emitValue(next);
		},
		onBackspace() {
			if (this.draft.length > 0 || this.tags.length === 0) return;
			this.removeTag(this.tags.length - 1);
		},
		emitValue(next) {
			// Only emit when something actually changed, so we don't mark the
			// form dirty on every keystroke.
			if (sameTags(next, this.tags)) return;
			this.$emit('input', next);
		},
	},
};

function parseTags(value) {
	if (Array.isArray(value)) {
		return value.map((tag) => String(tag)).filter((tag) => tag.length > 0);
	}

	if (typeof value === 'string' && value.trim().length > 0) {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
		} catch {
			// Tolerate a plain comma-separated string.
			return value
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);
		}
	}

	return [];
}

function sameTags(a, b) {
	return a.length === b.length && a.every((tag, i) => tag === b[i]);
}
</script>

<style scoped>
.tag-input {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	width: 100%;
	box-sizing: border-box;
	padding: 6px 8px;
	background: var(--theme--form--field--input--background, var(--theme--background, #fff));
	border: var(--theme--border-subtle, 1px solid #ccc);
	border-radius: var(--theme--border-radius, 6px);
}

.chips {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	flex: 1 1 auto;
	min-width: 0;
	color: #000;
}

.placeholder {
	color: var(--theme--form--field--input--foreground-subdued, #888);
	font-size: 13px;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 4px 2px 8px;
	font-size: 13px;
	line-height: 1.4;
	color: #000000;
	background: var(--theme--primary-150, #e6e6ff);
	border-radius: 999px;
	white-space: nowrap;
}

.chip-remove {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: inherit;
	font-size: 14px;
	line-height: 1;
	cursor: pointer;
}

.chip-remove:hover {
	background: var(--theme--primary-250, #cfcfff);
}

.tag-field {
	flex: 1 1 120px;
	min-width: 120px;
	border: none;
	outline: none;
	background: transparent;
	color: var(--theme--form--field--input--foreground, #000000);
	font: inherit;
	font-size: 13px;
	padding: 2px 0;
}

.tag-field::placeholder {
	color: var(--theme--form--field--input--foreground-subdued, #888);
	opacity: 1;
}
</style>
