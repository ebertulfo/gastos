'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import TodayView from "./today-view";
import WeeklyView from "./weekly-view";
import MonthlyView from "./monthly-view";

export default function Tracker() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="today">
                <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                    <TabsTrigger value="month">This Month</TabsTrigger>
                </TabsList>

                <TabsContent value="today">
                    <TodayView />
                </TabsContent>
                <TabsContent value="week">
                    <WeeklyView />
                </TabsContent>
                <TabsContent value="month">
                    <MonthlyView />
                </TabsContent>
            </Tabs>
        </div>
    )
}