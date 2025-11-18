// src/components/ui/summary-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  iconBgColor: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconColor,
  iconBgColor,
}: SummaryCardProps) {
  return (
    <Card className={`${gradient} border-0`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${iconColor.replace('text-', 'text-').replace('600', '700')}`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${iconColor.replace('600', '900')}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-sm ${iconColor} mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 ${iconBgColor} rounded-xl`}>
            <Icon className={`h-8 w-8 ${iconColor.replace('600', '700')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}