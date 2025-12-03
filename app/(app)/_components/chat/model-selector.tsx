import { Models } from '@/types/models';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import Image from 'next/image';

interface ModelSelectorProps {
  model: Models;
  onModelChange: (model: Models) => void;
  disabled?: boolean;
}

const modelLogos = {
  [Models.OpenAI]: '/logos/openai.png',
  [Models.Anthropic]: '/logos/anthropic.png',
  [Models.XAI]: '/logos/xai.png',
  [Models.Gemini]: '/logos/google.png',
  [Models.Deepseek]: '/logos/deepseek.png',
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ model, onModelChange, disabled }) => {
  return (
    <Select
      value={model}
      onValueChange={(value) => onModelChange(value as Models)}
      disabled={disabled}
    >
      <SelectTrigger className="w-fit h-8 text-xs border-0 bg-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 shadow-none gap-2">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(Models).map((modelValue) => (
          <SelectItem key={modelValue} value={modelValue} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                src={modelLogos[modelValue]}
                alt={modelValue}
                width={16}
                height={16}
                className="rounded-sm"
              />
              {/* {modelValue.charAt(0).toUpperCase() + modelValue.slice(1)} */}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
