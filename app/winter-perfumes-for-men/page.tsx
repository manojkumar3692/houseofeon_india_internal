import SeasonalLanding, { seasonalMetadata } from "@/components/SeasonalLanding";
import { seasonalPages } from "@/lib/seasonalPages";
const page = seasonalPages[1];
export const metadata = seasonalMetadata(page);
export default function Page() { return <SeasonalLanding page={page} />; }
