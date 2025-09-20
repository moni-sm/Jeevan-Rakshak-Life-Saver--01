import { config } from 'dotenv';
config();

import '@/ai/flows/emergency-detection.ts';
import '@/ai/flows/multilingual-health-qa.ts';
import '@/ai/tools/find-nearby-hospitals.ts';
