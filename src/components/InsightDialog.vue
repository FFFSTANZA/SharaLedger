<template>
  <Modal :open-modal="show" @closemodal="closeDialog">
    <div class="w-dialog-lg p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-25">
          {{ t`Explain this value` }}
        </h2>
        <button
          class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          @click="closeDialog"
        >
          <FeatherIcon name="x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Context Info -->
      <div
        v-if="contextInfo"
        class="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm"
      >
        <p class="text-gray-700 dark:text-gray-300">
          <span class="font-medium">{{ contextInfo.label }}:</span>
          {{ contextInfo.value }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <Loading />
      </div>

      <!-- Question Selection -->
      <div
        v-else-if="!selectedTemplate && templates.length > 0"
        class="space-y-2"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {{ t`Select a question to explore:` }}
        </p>
        <button
          v-for="template in templates"
          :key="template.name"
          class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          @click="selectQuestion(template)"
        >
          <div class="font-medium text-gray-900 dark:text-gray-25">
            {{ template.questionText }}
          </div>
          <div
            v-if="template.trustLevel !== '1'"
            class="text-xs text-gray-500 dark:text-gray-500 mt-1"
          >
            {{ getTrustLevelLabel(template.trustLevel) }}
          </div>
        </button>
      </div>

      <!-- No Questions Available -->
      <div
        v-else-if="!selectedTemplate && templates.length === 0"
        class="text-center py-8 text-gray-600 dark:text-gray-400"
      >
        <p>{{ t`No explanations available for this value.` }}</p>
      </div>

      <!-- Narrative Display -->
      <div v-else-if="narrative" class="space-y-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-gray-900 dark:text-gray-25">
            {{ selectedTemplate?.questionText }}
          </h3>
          <button
            class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            @click="backToQuestions"
          >
            {{ t`Ask Another` }}
          </button>
        </div>
        <div
          class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-gray-900 dark:text-gray-100"
        >
          <p class="whitespace-pre-wrap">{{ narrative }}</p>
        </div>
        <div class="flex justify-end">
          <Button type="primary" @click="closeDialog">
            {{ t`Done` }}
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { InsightService } from 'models/insights/insightService';
import { InsightContext } from 'models/insights/types';
import Button from 'src/components/Button.vue';
import FeatherIcon from 'src/components/FeatherIcon.vue';
import Loading from 'src/components/Loading.vue';
import Modal from 'src/components/Modal.vue';
import { fyo } from 'src/initFyo';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'InsightDialog',
  components: { Modal, Button, FeatherIcon, Loading },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    contextType: {
      type: String,
      required: false,
    },
    contextField: {
      type: String,
      required: false,
    },
    context: {
      type: Object as PropType<InsightContext>,
      required: false,
    },
    contextInfo: {
      type: Object as PropType<{ label: string; value: string }>,
      required: false,
    },
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      templates: [] as Doc[],
      selectedTemplate: null as Doc | null,
      narrative: '',
      insightService: null as InsightService | null,
    };
  },
  watch: {
    async show(newValue: boolean) {
      if (newValue && this.contextType && this.contextField) {
        await this.loadTemplates();
      }
    },
  },
  mounted() {
    this.insightService = new InsightService(fyo);
  },
  methods: {
    async loadTemplates() {
      if (!this.contextType || !this.contextField || !this.insightService) {
        return;
      }

      this.loading = true;
      try {
        this.templates = await this.insightService.getTemplatesForContext(
          this.contextType,
          this.contextField
        );
      } catch (error) {
        console.error('Failed to load insight templates:', error);
        this.templates = [];
      } finally {
        this.loading = false;
      }
    },
    async selectQuestion(template: Doc) {
      if (
        !this.context ||
        !this.contextType ||
        !this.contextField ||
        !this.insightService
      ) {
        return;
      }

      this.selectedTemplate = template;
      this.loading = true;

      try {
        const result = await this.insightService.generateInsight(
          this.contextType,
          this.contextField,
          template.name as string,
          this.context
        );
        this.narrative = result.narrative;
      } catch (error) {
        console.error('Failed to generate insight:', error);
        this.narrative = t`Unable to generate explanation. Please try again.`;
      } finally {
        this.loading = false;
      }
    },
    backToQuestions() {
      this.selectedTemplate = null;
      this.narrative = '';
    },
    closeDialog() {
      this.selectedTemplate = null;
      this.narrative = '';
      this.templates = [];
      this.$emit('close');
    },
    getTrustLevelLabel(level: unknown): string {
      if (level === '2') {
        return t`Needs Review`;
      } else if (level === '3') {
        return t`Experimental`;
      }
      return '';
    },
  },
});
</script>
