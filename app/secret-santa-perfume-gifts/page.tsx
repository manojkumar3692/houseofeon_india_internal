import SeasonalLanding, { seasonalMetadata } from "@/components/SeasonalLanding";
import { seasonalPages } from "@/lib/seasonalPages";
const page = seasonalPages[0];
export const metadata = seasonalMetadata(page);
export default function Page() { return <SeasonalLanding page={page} />; }
