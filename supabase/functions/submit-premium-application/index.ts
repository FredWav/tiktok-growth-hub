import { applicationHandler } from "../_shared/submit-application.ts";
Deno.serve(applicationHandler("premium"));
